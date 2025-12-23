import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let repository: Repository<PasswordResetToken>;
  let configService: ConfigService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'passwordReset.tokenExpiry') return '3600';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    repository = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a secure random token', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      expect(token1).toBeDefined();
      expect(token1.length).toBeGreaterThan(0);
      expect(token1).not.toBe(token2); // Tokens should be unique
      expect(token1).toMatch(/^[a-f0-9]+$/); // Hex string
    });
  });

  describe('saveToken', () => {
    it('should save a token and invalidate existing tokens', async () => {
      const userId = 'user-123';
      const token = 'test-token';
      const expiresAt = new Date(Date.now() + 3600000);

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.create.mockReturnValue({
        userId,
        token,
        expiresAt,
        used: false,
      });
      mockRepository.save.mockResolvedValue({
        id: 'token-id',
        userId,
        token,
        expiresAt,
        used: false,
      });

      const result = await service.saveToken(userId, token);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId, used: false },
        { used: true },
      );
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.token).toBe(token);
      expect(result.userId).toBe(userId);
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const token = 'valid-token';
      const resetToken = {
        id: 'token-id',
        token,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        user: { id: 'user-123', email: 'test@example.com' },
      };

      mockRepository.findOne.mockResolvedValue(resetToken);

      const result = await service.validateToken(token);

      expect(result).toEqual(resetToken);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
    });

    it('should throw error for non-existent token', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for used token', async () => {
      const resetToken = {
        id: 'token-id',
        token: 'used-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        used: true,
      };

      mockRepository.findOne.mockResolvedValue(resetToken);

      await expect(service.validateToken('used-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for expired token', async () => {
      const resetToken = {
        id: 'token-id',
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000), // Expired
        used: false,
      };

      mockRepository.findOne.mockResolvedValue(resetToken);

      await expect(service.validateToken('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark token as used', async () => {
      const token = 'test-token';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.markTokenAsUsed(token);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { token },
        { used: true },
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 5 });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});

