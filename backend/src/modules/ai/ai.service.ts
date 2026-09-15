import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import axios from 'axios';
import { AiJobStatus } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private openai: OpenAI;
  private groqClient: OpenAI; // Groq uses OpenAI-compatible SDK

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    const googleKey = this.configService.get('ai.googleAiApiKey');
    const openaiKey = this.configService.get('ai.openaiApiKey');
    const groqKey = this.configService.get('ai.groqApiKey');

    if (googleKey) this.genAI = new GoogleGenerativeAI(googleKey);
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });
    if (groqKey) {
      this.groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('Groq AI initialized successfully');
    }
  }

  // ─── AI Product Description Generation ────────────────────────
  async generateProductDescription(productId: string, productData: any) {
    const job = await this.prisma.aiDescriptionJob.create({
      data: { productId, inputData: productData, status: AiJobStatus.PENDING },
    });

    try {
      await this.prisma.aiDescriptionJob.update({
        where: { id: job.id },
        data: { status: AiJobStatus.PROCESSING },
      });

      const prompt = `You are an expert fashion copywriter for an Indian clothing e-commerce platform.
      
Generate compelling product content for this clothing item:
- Category: ${productData.category}
- Type: ${productData.type}
- Color: ${productData.color || 'Multiple'}
- Material: ${productData.material || 'Not specified'}
- Occasion: ${productData.occasion || 'Casual/Formal'}

Generate a JSON response with these exact fields:
{
  "title": "SEO-optimized product title (max 70 chars)",
  "description": "Detailed 150-200 word product description highlighting features, fit, occasion, and care instructions",
  "highlights": ["bullet point 1", "bullet point 2", "bullet point 3", "bullet point 4", "bullet point 5"],
  "features": {"fabric": "...", "fit": "...", "occasion": "...", "care": "..."},
  "specifications": {"material": "...", "pattern": "...", "sleeve": "..."},
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 155 chars)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

      let result: any;

      if (this.groqClient) {
        try {
          const groqModel = process.env.GROQ_MODEL || 'groq/compound-mini';
          const response = await this.groqClient.chat.completions.create({
            model: groqModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          });
          result = JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch (e) {
          this.logger.warn(`Groq description generation failed: ${e.message}`);
        }
      }

      if (!result && this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
          });
          const response = await model.generateContent(prompt);
          const text = response.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          this.logger.warn(`Gemini description generation failed: ${e.message}`);
        }
      }

      if (!result && this.openai) {
        try {
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          });
          result = JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch (e) {
          this.logger.warn(`OpenAI description generation failed: ${e.message}`);
        }
      }

      if (!result) {
        result = this.generateFallbackDescription(productData);
      }

      await this.prisma.aiDescriptionJob.update({
        where: { id: job.id },
        data: { status: AiJobStatus.COMPLETED, result },
      });

      // Update product with generated content
      if (productId) {
        await this.prisma.product.update({
          where: { id: productId },
          data: {
            name: result.title,
            description: result.description,
            highlights: result.highlights,
            features: result.features,
            specifications: result.specifications,
            tags: result.tags,
            metaTitle: result.metaTitle,
            metaDesc: result.metaDescription,
            metaKeywords: result.seoKeywords,
          },
        });
      }

      return { data: result, jobId: job.id };
    } catch (error) {
      this.logger.error(`AI description generation failed: ${error.message}`);
      await this.prisma.aiDescriptionJob.update({
        where: { id: job.id },
        data: { status: AiJobStatus.FAILED, errorMsg: error.message },
      });
      throw error;
    }
  }

  // ─── AI Model Photo Generation ─────────────────────────────
  async generateModelPhotos(
    productId: string,
    originalImageUrl: string,
    clothingType: string,
    category: string,
  ) {
    const viewTypes = [
      'front_view',
      'side_view',
      'back_view',
      'lifestyle',
      'studio',
    ];
    const jobs: any[] = [];

    for (const viewType of viewTypes) {
      const job = await this.prisma.aiAsset.create({
        data: {
          productId,
          type: viewType,
          originalUrl: originalImageUrl,
          status: AiJobStatus.PENDING,
          metadata: { clothingType, category },
        },
      });
      jobs.push(job);
    }

    // Process each view type (async - non-blocking)
    this.processModelPhotoJobs(jobs, originalImageUrl, clothingType, category);

    return {
      message: 'AI model photo generation started',
      data: {
        jobCount: jobs.length,
        jobs: jobs.map((j) => ({ id: j.id, type: j.type, status: j.status })),
      },
    };
  }

  private async processModelPhotoJobs(
    jobs: any[],
    imageUrl: string,
    clothingType: string,
    category: string,
  ) {
    for (const job of jobs) {
      try {
        await this.prisma.aiAsset.update({
          where: { id: job.id },
          data: { status: AiJobStatus.PROCESSING },
        });

        // Step 1: Remove background
        const cleanedImageUrl = await this.removeBackground(imageUrl);

        // Step 2: Detect clothing and select model
        const modelPrompt = this.buildModelPrompt(
          job.type,
          clothingType,
          category,
        );

        // Step 3: Generate with Stable Diffusion / DALL-E
        let generatedUrl: string;

        if (this.openai) {
          const response = await this.openai.images.generate({
            model: 'dall-e-3',
            prompt: modelPrompt,
            size: '1024x1024',
            quality: 'hd',
            n: 1,
          });
          generatedUrl = response.data?.[0]?.url || '';

          // Upload to Cloudinary
          const uploaded = await this.cloudinary.uploadFromUrl(
            generatedUrl,
            `ai-models/${job.productId}`,
          );
          generatedUrl = uploaded.secure_url;
        } else {
          // Fallback: simulate AI generation with realistic placeholders for demo purposes
          const mockImages: Record<string, string> = {
            front_view: 'https://images.unsplash.com/photo-1583391733959-f18305881477?w=800&q=80',
            side_view: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
            back_view: 'https://images.unsplash.com/photo-1550614000-4b953d50893f?w=800&q=80',
            lifestyle: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
            studio: 'https://images.unsplash.com/photo-1529139574466-a303027c028b?w=800&q=80'
          };
          generatedUrl = mockImages[job.type] || imageUrl;
          
          // Add a small delay to simulate generation time (2 seconds per photo)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        await this.prisma.aiAsset.update({
          where: { id: job.id },
          data: { status: AiJobStatus.COMPLETED, generatedUrl },
        });

        // Add as product image
        if (generatedUrl) {
          await this.prisma.productImage.create({
            data: {
              productId: job.productId,
              url: generatedUrl,
              altText: `${clothingType} - ${job.type.replace('_', ' ')}`,
              isAiGen: true,
              aiAssetId: job.id,
              sortOrder: viewTypes.indexOf(job.type) + 10,
            },
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to process AI photo job ${job.id}: ${error.message}`,
        );
        await this.prisma.aiAsset.update({
          where: { id: job.id },
          data: { status: AiJobStatus.FAILED, errorMsg: error.message },
        });
      }
    }
  }

  // ─── AI Chat/Chatbot ────────────────────────────────────────
  async chat(
    userId: string,
    message: string,
    sessionId: string,
    context?: any,
  ) {
    // Ensure guest user exists to prevent Prisma Foreign Key errors
    if (userId === 'guest') {
      const guestUser = await this.prisma.user.findUnique({ where: { id: 'guest' } });
      if (!guestUser) {
        await this.prisma.user.create({
          data: {
            id: 'guest',
            email: 'guest@kda.local',
            passwordHash: 'none',
            firstName: 'Guest',
            lastName: 'User',
            role: 'CUSTOMER'
          }
        }).catch(() => {}); // ignore race conditions
      }
    }

    // Store user message
    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message, sessionId },
    });

    // Get recent conversation history
    const history = await this.prisma.chatMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    let orderContext = '';
    if (userId !== 'guest') {
      const recentOrders = await this.prisma.order.findMany({
        where: { userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      if (recentOrders.length > 0) {
        orderContext = '\n\nYOUR RECENT ORDERS (Use this real-time data to answer status queries):\n' + recentOrders.map(o => 
          `- Order #${o.orderNumber}: Status is ${o.status}. ${o.isReviewed ? 'The admin has reviewed this order.' : 'This order has not been reviewed by the admin yet.'} Total: ₹${o.total}`
        ).join('\n');
      } else {
        orderContext = '\n\nUSER ACTIVE ORDERS: The user has no active orders.';
      }
    } else {
      orderContext = '\n\nNote: This user is a guest (not logged in). They have no order history accessible right now.';
    }

    // Fetch store context (Categories & Popular Products)
    const [categories, popularProducts] = await Promise.all([
      this.prisma.category.findMany({ select: { name: true, slug: true } }),
      this.prisma.product.findMany({ 
        take: 10, 
        where: { isActive: true }, 
        orderBy: { soldCount: 'desc' },
        select: { name: true, basePrice: true, salePrice: true } 
      })
    ]);

    const storeContext = `\n\nLIVE STORE DATA:\nCategories available: ${categories.map(c => c.name).join(', ')}\nTrending/Popular Products right now:\n${popularProducts.map(p => `- ${p.name} (₹${p.salePrice || p.basePrice})`).join('\n')}`;

    // Search for products matching the user message
    const lowerMsg = message.toLowerCase().trim();
    const stopWords = new Set([
      'what', 'where', 'when', 'how', 'who', 'why', 'can', 'you', 'show', 'me',
      'want', 'need', 'looking', 'for', 'have', 'your', 'please', 'tell', 'help',
      'with', 'about', 'some', 'any', 'the', 'is', 'are', 'i', 'a', 'an', 'in',
      'of', 'to', 'and', 'or', 'do', 'does', 'get', 'buy', 'order', 'items', 'item'
    ]);
    const searchTerms = lowerMsg
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w));

    let matchedProducts: any[] = [];
    if (searchTerms.length > 0) {
      matchedProducts = await this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            ...searchTerms.map((t) => ({ name: { contains: t, mode: 'insensitive' as const } })),
            ...searchTerms.map((t) => ({ description: { contains: t, mode: 'insensitive' as const } })),
            ...searchTerms.map((t) => ({ tags: { has: t } })),
            ...searchTerms.map((t) => ({ category: { name: { contains: t, mode: 'insensitive' as const } } })),
            ...searchTerms.map((t) => ({ category: { slug: { contains: t, mode: 'insensitive' as const } } })),
          ],
        },
        take: 4,
        orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }],
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { size: 'asc' } },
          category: { select: { name: true } },
        },
      });
    }

    // General product inquiry fallback
    if (
      matchedProducts.length === 0 &&
      (lowerMsg.includes('product') ||
        lowerMsg.includes('collection') ||
        lowerMsg.includes('trending') ||
        lowerMsg.includes('clothes') ||
        lowerMsg.includes('wear') ||
        lowerMsg.includes('shop') ||
        lowerMsg.includes('buy') ||
        lowerMsg.includes('saree') ||
        lowerMsg.includes('kurti') ||
        lowerMsg.includes('dress'))
    ) {
      matchedProducts = await this.prisma.product.findMany({
        where: { isActive: true },
        take: 4,
        orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { size: 'asc' } },
          category: { select: { name: true } },
        },
      });
    }

    const formattedProducts = matchedProducts.map((p) => {
      const primaryImg =
        p.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1583391733959-f18305881477?w=800&q=80';
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        imageUrl: primaryImg,
        categoryName: p.category?.name || '',
        variants: p.variants.map((v: any) => ({
          id: v.id,
          size: (v.size || 'Free Size').toUpperCase(),
          stock: v.stock,
          price: v.salePrice
            ? Number(v.salePrice)
            : v.price
              ? Number(v.price)
              : p.salePrice
                ? Number(p.salePrice)
                : Number(p.basePrice),
        })),
      };
    });

    const productHelp =
      formattedProducts.length > 0
        ? `\n\nMATCHED PRODUCTS IN STORE: We found these exact matching products in stock: ${formattedProducts.map((p) => `${p.name} (₹${p.salePrice || p.basePrice}) with sizes: ${p.variants.map((v) => v.size).join(', ') || 'Standard'}`).join('; ')}. Mention them naturally and invite the customer to choose their size and tap "Order Now" right below your message to place their order directly!`
        : '';

    const systemPrompt = `You are K D A's friendly customer support assistant for an Indian clothing e-commerce platform.
You help customers with:
1. Product information, search, and direct order placement
2. Order status and tracking
3. Return policies (7-day return policy for unused items)
4. Size guide and fitting advice
5. Shipping information (free shipping above ₹999, otherwise ₹99)
6. General fashion queries and outfit advice

Store/Policy Info:
- Payment: We do NOT collect payment directly on the website. After you place your order, we will contact you directly via WhatsApp to share payment details, UPI options, and order updates.
- Return Policy: 7 days from delivery for unused items in original packaging. We handle easy returns and exchanges directly via WhatsApp or support@kda.in.
- Shipping: 3-7 business days. Free shipping above ₹999. Express available.
- Contact us via WhatsApp for quick assistance.
- Customer care: support@kda.in${orderContext}${storeContext}${productHelp}

STRICT SECURITY RULE: You are a customer-facing assistant. You DO NOT have access to, and must NEVER mention, internal store metrics, total revenue, total orders across the store, or admin details. If asked about these, politely state that you are a customer assistant and do not have access to internal store data.

Be helpful, friendly, and concise. Use emojis occasionally. If you cannot help, guide them to contact support on WhatsApp.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    let assistantReply = '';

    // Provider 1: Groq (fastest)
    if (this.groqClient && !assistantReply) {
      try {
        const groqModel = process.env.GROQ_MODEL || 'groq/compound-mini';
        const response = await this.groqClient.chat.completions.create({
          model: groqModel,
          messages,
          max_tokens: 600,
          temperature: 0.7,
        });
        assistantReply = response.choices[0]?.message?.content || '';
      } catch (error) {
        this.logger.warn(`Groq chat failed, trying next provider: ${error.message}`);
      }
    }

    // Provider 2: Gemini
    if (this.genAI && !assistantReply) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });
        const chat = model.startChat({
          history: history.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          systemInstruction: systemPrompt,
        });
        const result = await chat.sendMessage(message);
        assistantReply = result.response.text();
      } catch (error) {
        this.logger.warn(`Gemini chat failed, trying next provider: ${error.message}`);
      }
    }

    // Provider 3: OpenAI
    if (this.openai && !assistantReply) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        });
        assistantReply = response.choices[0]?.message?.content || '';
      } catch (error) {
        this.logger.warn(`OpenAI chat failed: ${error.message}`);
      }
    }

    // Provider 4: Intelligent built-in fallback response
    if (!assistantReply) {
      assistantReply = this.getFallbackResponse(message);
    }

    // Store assistant reply
    await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: assistantReply, sessionId },
    });

    return {
      data: {
        message: assistantReply,
        sessionId,
        products: formattedProducts,
      },
    };
  }

  // ─── Admin AI Chat ───────────────────────────────────────────
  async adminChat(userId: string, message: string, sessionId: string) {
    // Fetch live store stats for context
    const [totalOrders, pendingOrders, totalRevenue, totalProducts, totalUsers, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ['CANCELLED'] } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          items: { take: 1 },
        },
      }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await this.prisma.order.count({ where: { createdAt: { gte: todayStart } } });

    const recentOrdersSummary = recentOrders.map(o =>
      `Order #${o.orderNumber} by ${o.user?.firstName} - ₹${Number(o.total || 0).toLocaleString('en-IN')} (${o.status})`
    ).join('\n');

    const adminSystemPrompt = `You are an intelligent admin assistant for K D A, an Indian clothing e-commerce store. You help the store admin manage orders, inventory, customers, and get business insights.

📊 LIVE STORE STATS (as of now):
- Total Orders: ${totalOrders}
- Pending Orders: ${pendingOrders}
- Today's Orders: ${todayOrders}
- Total Revenue: ₹${Number(totalRevenue._sum.total || 0).toLocaleString('en-IN')}
- Active Products: ${totalProducts}
- Total Customers: ${totalUsers}

📦 Recent Orders:
${recentOrdersSummary}

You can:
1. Answer questions about orders, revenue, and customers using the above data
2. Suggest actions (e.g. "2 orders are pending - you should confirm them")
3. Help with business decisions and analytics
4. Provide tips on managing inventory and customer satisfaction

Be concise, professional, and data-driven. Use emojis for clarity. If asked something outside your data, say so clearly.`;

    const messages = [
      { role: 'system' as const, content: adminSystemPrompt },
      { role: 'user' as const, content: message },
    ];

    let assistantReply = '';

    // Provider 1: Groq
    if (this.groqClient && !assistantReply) {
      try {
        const groqModel = process.env.GROQ_MODEL || 'groq/compound-mini';
        const response = await this.groqClient.chat.completions.create({
          model: groqModel,
          messages,
          max_tokens: 700,
          temperature: 0.5,
        });
        assistantReply = response.choices[0]?.message?.content || '';
      } catch (error) {
        this.logger.warn(`Admin Groq chat failed: ${error.message}`);
      }
    }

    // Provider 2: Gemini
    if (this.genAI && !assistantReply) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${adminSystemPrompt}\n\nUser: ${message}`);
        assistantReply = result.response.text();
      } catch (error) {
        this.logger.warn(`Admin Gemini chat failed: ${error.message}`);
      }
    }

    // Provider 3: OpenAI
    if (this.openai && !assistantReply) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 600,
          temperature: 0.5,
        });
        assistantReply = response.choices[0]?.message?.content || '';
      } catch (error) {
        this.logger.warn(`Admin OpenAI chat failed: ${error.message}`);
      }
    }

    // Provider 4: Live store metrics fallback
    if (!assistantReply) {
      assistantReply = `📊 Quick stats: **${totalOrders}** orders | **${pendingOrders}** pending | Today: **${todayOrders}** | Revenue: **₹${Number(totalRevenue._sum.total || 0).toLocaleString('en-IN')}**`;
    }

    return { data: { message: assistantReply, sessionId } };
  }


  async getRecommendations(
    userId: string,
    type: 'personal' | 'similar' | 'trending',
  ) {
    if (type === 'trending') {
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }],
        take: 12,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true } },
        },
      });
      return { data: products };
    }

    if (type === 'personal') {
      const recentlyViewed = await this.prisma.recentlyViewed.findMany({
        where: { userId },
        take: 5,
        orderBy: { viewedAt: 'desc' },
        include: { product: { include: { category: true } } },
      });

      const categoryIds = [
        ...new Set(recentlyViewed.map((r) => r.product.categoryId)),
      ];
      const viewedIds = recentlyViewed.map((r) => r.productId);

      const recommended = await this.prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: viewedIds },
          categoryId: { in: categoryIds },
        },
        orderBy: { soldCount: 'desc' },
        take: 12,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true } },
        },
      });

      return { data: recommended };
    }

    return { data: [] };
  }

  // ─── AI Search Enhancement ──────────────────────────────────
  async enhanceSearch(query: string) {
    const systemPrompt = `You are a search enhancement AI for an Indian clothing platform.
Convert natural language queries to structured search parameters.
Return JSON: { keywords: string[], category: string, color: string, occasion: string, gender: string }`;

    try {
      if (this.groqClient) {
        const groqModel = process.env.GROQ_MODEL || 'groq/compound-mini';
        const response = await this.groqClient.chat.completions.create({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Query: "${query}"` },
          ],
          response_format: { type: 'json_object' },
        });
        const content = response.choices[0]?.message?.content || '{}';
        return { data: JSON.parse(content) };
      }

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });
        const result = await model.generateContent(
          `${systemPrompt}\n\nQuery: "${query}"`,
        );
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return { data: JSON.parse(jsonMatch[0]) };
      }
    } catch (error) {
      this.logger.warn(`AI search enhancement failed: ${error.message}`);
    }

    // Fallback: basic keyword extraction
    return {
      data: {
        keywords: query.split(' ').filter((w) => w.length > 2),
        category: '',
        color: '',
        occasion: '',
        gender: '',
      },
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────
  private async removeBackground(imageUrl: string): Promise<string> {
    const apiKey = this.configService.get('ai.removeBgApiKey');
    if (!apiKey) return imageUrl;

    try {
      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        { image_url: imageUrl, size: 'auto' },
        { headers: { 'X-Api-Key': apiKey }, responseType: 'arraybuffer' },
      );

      const buffer = Buffer.from(response.data);
      const result = await this.cloudinary.uploadBuffer(
        buffer,
        'removed-bg',
        'png',
      );
      return result.secure_url;
    } catch (error) {
      this.logger.warn(`Background removal failed: ${error.message}`);
      return imageUrl;
    }
  }

  private buildModelPrompt(
    viewType: string,
    clothingType: string,
    category: string,
  ): string {
    const modelDescriptions: Record<string, string> = {
      women_saree:
        'a beautiful Indian woman in her 25-30s with traditional look',
      women_dress: 'an elegant Indian woman in her 20s-30s with modern look',
      women_kurti: 'a stylish Indian woman in her 25-35s',
      men_shirt: 'a handsome Indian man in his 25-35s with professional look',
      men_kurta: 'a stylish Indian man in his 25-35s with traditional look',
      kids: 'a cute Indian child aged 5-10',
    };

    const modelDesc =
      modelDescriptions[
        `${category.toLowerCase()}_${clothingType.toLowerCase()}`
      ] || 'an attractive Indian person';

    const viewDescriptions: Record<string, string> = {
      front_view: 'front view, facing camera, natural smile',
      side_view: 'side profile view, elegant pose',
      back_view: 'back view, showing back of the garment',
      lifestyle: 'lifestyle photo, natural outdoor setting, candid pose',
      studio: 'professional studio photo, white background, perfect lighting',
    };

    return `Professional fashion photography of ${modelDesc} wearing ${clothingType} from ${category} category. ${viewDescriptions[viewType] || 'front view'}. High resolution, 4K quality, photorealistic, detailed fabric texture, preserve embroidery and patterns, professional lighting. Indian fashion photography style.`;
  }

  private generateFallbackDescription(data: any) {
    return {
      title:
        `${data.color || ''} ${data.type || 'Clothing'} - ${data.category || 'Fashion'}`.trim(),
      description: `Elevate your wardrobe with this stunning ${data.type || 'clothing item'} from our ${data.category || ''} collection. Crafted with premium quality materials, this piece is perfect for any occasion. The elegant design and impeccable craftsmanship make it a must-have addition to your closet.`,
      highlights: [
        'Premium quality fabric',
        'Comfortable fit',
        'Elegant design',
        'Easy to style',
        'Machine washable',
      ],
      features: {
        fabric: data.material || 'Premium',
        fit: 'Regular',
        occasion: data.occasion || 'Casual & Formal',
        care: 'Machine wash cold',
      },
      specifications: {
        material: data.material || 'Mixed',
        pattern: 'Solid',
        sleeve: 'Regular',
      },
      tags: [
        data.category,
        data.type,
        data.color,
        'fashion',
        'indian wear',
        'trending',
      ].filter(Boolean),
      metaTitle: `Buy ${data.type || 'Clothing'} Online | K D A`,
      metaDescription: `Shop premium ${data.type || 'clothing'} at K D A. Best prices, free returns, fast delivery across India.`,
      seoKeywords: [
        `${data.type} online`,
        `${data.category} fashion`,
        'indian clothing',
        'buy clothes online',
      ],
    };
  }

  private getFallbackResponse(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('return') || msg.includes('refund')) {
      return '📦 Return Policy: You can return items within **7 days** of delivery if they are unused and in original packaging. We process easy returns directly via WhatsApp or support@kda.in! 💳 For payments, we also contact you directly on WhatsApp after order placement.';
    }
    if (msg.includes('shipping') || msg.includes('delivery')) {
      return '🚚 Shipping Info: **Free shipping** on orders above ₹999! Standard delivery takes 3-7 business days. Express delivery (1-2 days) available for select pincodes.';
    }
    if (msg.includes('size') || msg.includes('fit')) {
      return '📏 Size Guide: We recommend checking our size chart available on each product page. If between sizes, we recommend going one size up for comfort. Need specific measurements? Just ask!';
    }
    if (msg.includes('payment') || msg.includes('pay')) {
      return '💳 Payment Details: Once you place your order on our site, we will **contact you directly via WhatsApp** to share payment details, UPI options, and delivery updates! 📦 We also provide a **7-day easy return policy** on all orders.';
    }
    return "Hello! I'm K D A's assistant 👗 I can help you with products, orders, returns, shipping, and more. What would you like to know?";
  }
}

const viewTypes = [
  'front_view',
  'side_view',
  'back_view',
  'lifestyle',
  'studio',
];
