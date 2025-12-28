import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';

@Controller('admin')
export class AdminAuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get('login')
  loginPage(@Res() res: Response) {
    return res.render('admin/auth/login', {
      title: 'Admin Login',
    });
  }

  @Public()
  @Post('login')
  async login(
    @Body() adminLoginDto: AdminLoginDto,
    @Res() res: Response,
  ) {
    try {
      // Validate credentials
      const user = await this.usersService.findByEmail(adminLoginDto.email);
      if (!user) {
        return res.render('admin/auth/login', {
          title: 'Admin Login',
          error: 'Invalid email or password',
        });
      }

      const isPasswordValid = await bcrypt.compare(
        adminLoginDto.password,
        user.password,
      );
      
      if (!isPasswordValid) {
        return res.render('admin/auth/login', {
          title: 'Admin Login',
          error: 'Invalid email or password',
        });
      }

      if (!user) {
        return res.render('admin/auth/login', {
          title: 'Admin Login',
          error: 'Invalid email or password',
        });
      }

      // Check if user is admin
      if (user.role !== Role.ADMIN) {
        return res.render('admin/auth/login', {
          title: 'Admin Login',
          error: 'Access denied. Admin role required.',
        });
      }

      // Generate JWT token
      const token = this.authService.generateToken(
        user.id,
        user.email,
        user.role,
      );

      // Set HTTP-only cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Redirect to dashboard
      return res.redirect('/admin/dashboard');
    } catch (error) {
      return res.render('admin/auth/login', {
        title: 'Admin Login',
        error: 'An error occurred during login',
      });
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
}

