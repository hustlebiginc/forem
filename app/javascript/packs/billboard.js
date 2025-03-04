import { setupBillboardInteractivity } from '../utilities/billboardInteractivity';
import {
  observeBillboards,
  executeBBScripts,
  implementSpecialBehavior,
} from './billboardAfterRenderActions';

export async function getBillboard() {
  const placeholderElements = document.getElementsByClassName(
    'js-billboard-container',
  );

  const promises = [...placeholderElements].map(generateBillboard);
  await Promise.all(promises);
}

async function generateBillboard(element) {
  let { asyncUrl } = element.dataset;
  const currentParams = window.location.href.split('?')[1];
  const cookieStatus = localStorage.getItem('cookie_status');
  if (currentParams && currentParams.includes('bb_test_placement_area')) {
    asyncUrl = `${asyncUrl}?${currentParams}`;
  }

  if (cookieStatus === 'allowed') {
    asyncUrl += `${asyncUrl.includes('?') ? '&' : '?'}cookies_allowed=true`;
  }

  if (asyncUrl) {
    try {
      const response = await window.fetch(asyncUrl);
      const htmlContent = await response.text();
      const generatedElement = document.createElement('div');
      generatedElement.innerHTML = htmlContent;
      element.innerHTML = '';
      element.appendChild(generatedElement);
      element.querySelectorAll('img').forEach((img) => {
        img.onerror = function () {
          this.style.display = 'none';
        };
      });
      const dismissalSku =
        element.querySelector('.js-billboard')?.dataset.dismissalSku;
      if (localStorage && dismissalSku && dismissalSku.length > 0) {
        const skuArray =
          JSON.parse(localStorage.getItem('dismissal_skus_triggered')) || [];
        if (skuArray.includes(dismissalSku)) {
          element.style.display = 'none';
        }
      }
      executeBBScripts(element);
      implementSpecialBehavior(element);
      setupBillboardInteractivity();
      // This is called here because the ad is loaded asynchronously.
      // The original code is still in the asset pipeline, so is not importable.
      // This could be refactored to be importable as we continue that migration.
      // eslint-disable-next-line no-undef
      observeBillboards();
    } catch (error) {
      if (!/NetworkError/i.test(error.message)) {
        Honeybadger.notify(error);
      }
    }
  }
}

getBillboard();
