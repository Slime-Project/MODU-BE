import { Injectable, RequestTimeoutException } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';

import { PrismaService } from '@/prisma/prisma.service';

import { CrawledItemResDto } from './dto/crawled-item-res.dto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stealthPlugin = require('puppeteer-extra-plugin-stealth');

@Injectable()
export class CrawlerService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProducts(
    product: string,
    min: string,
    max: string,
    tagIds?: number[]
  ): Promise<CrawledItemResDto> {
    const puppeteerExtra = addExtra(puppeteer);
    const stealth = stealthPlugin();
    puppeteerExtra.use(stealth);
    const browser = await puppeteerExtra.launch();
    const encodedProduct = encodeURIComponent(product);
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000); // 2분내로 작업이 진행되지않으면 catch문 실행됨
      await page.setViewport({ width: 1500, height: 900 });
      await Promise.all([
        page.waitForNavigation(), // goto()가 완전히 실행될 때까지 기다리게 됨.
        page.goto(`https://search.shopping.naver.com/ns/search?query=${encodedProduct}`)
      ]);

      // await page.screenshot({
      //   path: `debug-${Date.now()}.png`,
      //   fullPage: true
      // });

      try {
        await page.waitForSelector('#filter_min_price', { timeout: 500 }); // 0.5초 대기
      } catch (error) {
        throw new RequestTimeoutException('The filter_min_price element was not found.', {
          description: 'Product does not exist in Naver Store'
        });
      }

      await page.type('#filter_min_price', min);
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 250);
      });
      await page.type('#filter_min_price', ' ');
      await page.type('#filter_max_price', max);
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 250);
      });
      await page.waitForSelector('._submit_18zzo_94');
      await Promise.all([page.waitForNavigation(), page.click('._submit_18zzo_94')]);
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve();
        }, 250);
      });

      const result = await page.$$eval(
        '#composite-card-list .compositeCardList_product_list__Ih4JR li',
        resultItems => {
          return resultItems.slice(0, 4).map(resultItem => {
            const title = resultItem.querySelector(
              '.basicProductCardInformation_basic_product_card_information__7v_uc strong'
            ).textContent;

            const linkElement = resultItem.querySelector(
              'a.basicProductCard_link__urzND'
            ) as HTMLAnchorElement;
            const link = linkElement ? linkElement.href : null;

            const imgElement = resultItem.querySelector(
              'img.autoFitImg_auto_fit_img__fIpj4'
            ) as HTMLImageElement;
            const img = imgElement ? imgElement.src : null;

            const price = resultItem.querySelector('.priceTag_inner_price__TctbK').textContent;

            const seller = resultItem.querySelector(
              '.basicProductCardInformation_mall_name__8IS3Q'
            ).textContent;
            return {
              title,
              img,
              link,
              price: parseInt(price.replace('원', '').split(',').join('')),
              seller
            };
          });
        }
      );

      const productArrWithId = await Promise.all(
        result.map(async item => {
          return this.prismaService.product.create({
            data: {
              title: item.title,
              img: item.img,
              price: item.price,
              seller: item.seller,
              link: item.link,
              tags: {
                create: tagIds.map(tagId => ({ tagId }))
              }
            }
          });
        })
      );

      return {
        keyword: product.replace(/\b/g, ''),
        items: productArrWithId
      };
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'error occured during crawling'
      });
    } finally {
      await browser.close();
    }
  }
}
