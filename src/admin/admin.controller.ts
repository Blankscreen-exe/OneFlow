import { Controller, Get, UseGuards, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminUser } from './decorators/admin-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('admin')
export class AdminController {
  @Public()
  @Get()
  root(@Res() res: Response) {
    // Redirect to login page
    return res.redirect('/admin/login');
  }
  
  @UseGuards(AdminAuthGuard)
  @Get('dashboard')
  dashboard(@Res() res: Response, @AdminUser() user: any) {
    return res.render('admin/dashboard', {
      title: 'Dashboard',
      currentRoute: 'dashboard',
      user: user || null, // Ensure user is never undefined
    });
  }

  @UseGuards(AdminAuthGuard)
  @Get('403')
  forbidden(@Res() res: Response) {
    return res.render('admin/errors/403', {
      title: 'Access Forbidden',
    });
  }

  @UseGuards(AdminAuthGuard)
  @Get('404')
  notFound(@Res() res: Response) {
    return res.render('admin/errors/404', {
      title: 'Page Not Found',
    });
  }
}

