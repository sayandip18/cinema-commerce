import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/send-otp')
  async signupSendOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendOtp(dto.phone);
    return { data: { message: 'OTP sent' } };
  }

  @Post('signup/verify-otp')
  async signupVerifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtpForSignup(
      dto.phone,
      dto.otp,
    );
    return { data: result };
  }

  @Post('signup/complete')
  async completeSignup(
    @Headers('authorization') authHeader: string,
    @Body() dto: CompleteSignupDto,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    const result = await this.authService.completeSignup(
      token,
      dto.name,
      dto.email,
    );
    return { data: result };
  }

  @Post('signin/send-otp')
  async signinSendOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendOtp(dto.phone);
    return { data: { message: 'OTP sent' } };
  }

  @Post('signin/verify-otp')
  async signinVerifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtpForSignin(
      dto.phone,
      dto.otp,
    );
    return { data: result };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(dto.refreshToken);
    return { data: tokens };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
    return { data: { message: 'Logged out' } };
  }
}
