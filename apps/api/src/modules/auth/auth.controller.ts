import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(dto);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Login with Google OAuth' })
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthCallback(@Req() req: any, @Res() res: Response) {
        const result = await this.authService.validateOAuthUser({
            email: req.user.email,
            name: req.user.name,
            image: req.user.picture,
            provider: 'google',
            providerAccountId: req.user.id,
        });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user info' })
    @ApiResponse({ status: 200, description: 'Current user info' })
    async me(@CurrentUser() user: any) {
        return user;
    }
}
