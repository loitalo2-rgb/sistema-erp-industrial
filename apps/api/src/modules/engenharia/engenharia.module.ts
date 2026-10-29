import { Module } from '@nestjs/common';
import { EngenhariaService } from './engenharia.service';
import { EngenhariaController } from './engenharia.controller';

@Module({
  controllers: [EngenhariaController],
  providers: [EngenhariaService],
  exports: [EngenhariaService],
})
export class EngenhariaModule {}
