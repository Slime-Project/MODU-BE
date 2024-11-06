import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  async getProducts(product: string, minPrice: string, maxPrice: string) {
    const browser = await puppeteer.launch({ headless: false });
    const encodedProduct = encodeURIComponent(product);
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await page.setViewport({ width: 1500, height: 900 });
      await Promise.all([
        page.waitForNavigation(),
        page.goto(`https://search.shopping.naver.com/ns/search?query=${encodedProduct}`)
      ]);

      await page.waitForSelector('#filter_min_price');
      await page.type('#filter_min_price', minPrice);
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.type('#filter_max_price', maxPrice);
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.waitForSelector('._submit_4u1o5_94');
      await new Promise(resolve => setTimeout(resolve, 500));
      await Promise.all([page.waitForNavigation(), page.click('._submit_4u1o5_94')]);
      await new Promise(resolve => setTimeout(resolve, 850));

      return await page.$$eval(
        '#composite-card-list .compositeCardList_product_list__Ih4JR li',
        resultItems => {
          return resultItems.slice(0, 5).map(resultItem => {
            const title = resultItem.querySelector(
              '.basicProductCardInformation_basic_product_card_information__7v_uc strong'
            ).textContent;

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
              price: parseInt(price.replace('원', '').split(',').join('')),
              seller
            };
          });
        }
      );
    } finally {
      console.log('Close Browser');
      await browser.close();
    }
  }
}
