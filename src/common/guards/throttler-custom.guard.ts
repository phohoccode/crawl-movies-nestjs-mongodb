/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerCustomGuard extends ThrottlerGuard {
  protected throwThrottlingException(context: any): Promise<void> {
    throw new ThrottlerException(
      'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
    );
  }
}
