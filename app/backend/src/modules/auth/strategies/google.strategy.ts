import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'mock-client-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'mock-client-secret',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User';
      const picture = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error('Email tidak ditemukan dari akun Google'), false);
      }

      const user = await this.authService.validateOrCreateGoogleUser({
        email,
        name,
        picture,
        googleId: profile.id,
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
