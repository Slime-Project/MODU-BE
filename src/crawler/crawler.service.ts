import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProducts(product: string, minPrice: string, maxPrice: string) {
    const browser = await puppeteer.launch({ headless: false });
    const encodedProduct = encodeURIComponent(product);
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000); //2분내로 작업이 진행되지않으면 catch문 실행됨
      await page.setViewport({ width: 1500, height: 900 });
      await Promise.all([
        page.waitForNavigation(), // goto()가 완전히 실행될 때까지 기다리게 됨.
        page.goto(`https://search.shopping.naver.com/ns/search?query=${encodedProduct}`)
      ]);

      await page.waitForSelector('#filter_min_price'); //해당 요소가 DOM에 추가될 때까지 대기
      await page.type('#filter_min_price', minPrice);
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.type('#filter_max_price', maxPrice);
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.waitForSelector('._submit_4u1o5_94');
      await new Promise(resolve => setTimeout(resolve, 500));
      await Promise.all([page.waitForNavigation(), page.click('._submit_4u1o5_94')]);
      await new Promise(resolve => setTimeout(resolve, 850));

      const result = await page.$$eval(
        //여기서부터 복습
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

      result.map(
        async product =>
          await this.prismaService.product.create({
            data: {
              title: product.title,
              img: product.img,
              price: product.price,
              seller: product.seller,
              link: product.link
            }
          })
      );
    } catch (error) {
      console.error('페이지 탐색 중 오류 발생:', error);
    } finally {
      console.log('Close Browser');
      await browser.close();
    }
  }
}
