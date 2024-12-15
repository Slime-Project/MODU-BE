import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { SearchResDto } from '@/search/dto/search-res.dto';
import { SearchDto } from '@/search/dto/search.dto';
import { SearchService } from '@/search/search.service';
import { getMockProduct } from '@/utils/unit-test';

import { SearchController } from './search.controller';

describe('SearchController', () => {
  let controller: SearchController;
  let service: DeepMockProxy<SearchService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockDeep<SearchService>() }]
    }).compile();

    controller = module.get(SearchController);
    service = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMany', () => {
    it('should return an instance of SearchResDto', async () => {
      const product = getMockProduct();
      const searchDto: SearchDto = {
        query: 'query'
      };
      service.findMany.mockResolvedValue({ products: [product], giftCollections: [] });
      const result = await controller.findMany(searchDto);
      expect(result).toBeInstanceOf(SearchResDto);
    });
  });
});
