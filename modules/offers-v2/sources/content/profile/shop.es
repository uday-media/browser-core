const reShop = /\bshop\b/i;
const reCart = /\bcart\b/i;
const reBasket = /\bbasket\b/i;
const reWarenkorb = /\bwarenkorb\b/i;

function hasWordShopInTitle(document) {
  return reShop.test(document.title);
}

function hasClassCart(document) {
  const classed = document.querySelectorAll('*[class*=cart], *[class*=basket]');
  for (const node of classed) {
    const className = node.className;
    if (reCart.test(className) || reBasket.test(className)) {
      return true;
    }
  }
  return false;
}

function hasKeywordInIconProperties(document) {
  // MS Edge doesn't support case-insensitive queries.
  // Let's hope nobody writes in upper case,
  // but support title case but dropping a first letter
  const images = document.querySelectorAll(`
    img[src*="cart"],
    img[src*="warenkorb"],
    img[title*="art"],
    img[title*="arenkorb"],
    img[alt*="art"],
    img[alt*="arenkorb"]
   `);
  for (const img of images) {
    for (const re of [reCart, reWarenkorb]) {
      for (const attr of [img.src, img.title, img.alt]) {
        if (re.test(attr)) {
          return true;
        }
      }
    }
  }
  return false;
}

// ebay, zalando: detected by `user-journey/features/new-page`.

export function isShopPage(document) {
  return hasWordShopInTitle(document)
    || hasClassCart(document)
    || hasKeywordInIconProperties(document);
}

export function shopPageDetection(window, chrome, CLIQZ) {
  if (window.parent !== window) {
    return;
  }

  const onDomContentLoaded = () => {
    if (isShopPage(window.document)) {
      CLIQZ.app.modules['offers-v2'].action(
        'learnTargeting',
        'page-class',
        {
          feature: 'shop',
          url: window.document.location.href,
          referrer: window.document.referrer
        }
      );
    }
  };

  window.addEventListener('DOMContentLoaded', onDomContentLoaded, { once: true });
}
