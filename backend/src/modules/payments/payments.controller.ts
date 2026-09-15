import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay order for payment' })
  createOrder(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createRazorpayOrder(orderId, userId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment signature after payment' })
  verify(@Body() dto: any, @CurrentUser('id') userId: string) {
    return this.paymentsService.verifyPayment(dto, userId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  webhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Post('refund/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate refund (Admin)' })
  refund(@Param('orderId') orderId: string, @Body('amount') amount?: number) {
    return this.paymentsService.initiateRefund(orderId, amount);
  }
}
