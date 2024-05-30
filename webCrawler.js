const fs = require('fs');
const puppeteer = require('puppeteer');

async function scrapeTerabyte() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.terabyteshop.com.br/busca?str=amd', { waitUntil: 'networkidle2', timeout: 60000 });

    const loadMoreButtonSelector = '.btn-load-more';
    let loadMoreVisible = await isElementVisible(page, loadMoreButtonSelector);

    // clica em "ver mais produtos"
    while (loadMoreVisible) {
        try {
            console.log('Clicando no botão "Clique para ver mais produtos"...');
            await page.click(loadMoreButtonSelector);
            await page.waitForTimeout(5000); // esperar para carregar os novos produtos
            loadMoreVisible = await isElementVisible(page, loadMoreButtonSelector);
        } catch (e) {
            console.log('Erro ao carregar mais produtos:', e);
            break;
        }
    }

    // pegando dados dos produtos
    const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.commerce_columns_item_inner'));
        return items.map(item => {
            const linkElement = item.querySelector('.commerce_columns_item_inner a');
            const imgElement = item.querySelector('.commerce_columns_item_inner img');
            const priceElement = item.querySelector('.prod-new-price');

            return {
                link: linkElement ? linkElement.href : null,
                title: linkElement ? linkElement.title.trim() : null,
                image: imgElement ? imgElement.src : null,
                price: priceElement ? priceElement.textContent.trim() : null
            };
        });
    });

    await browser.close();
    return products;
}

async function isElementVisible(page, selector) {
    let visible = true;
    await page
        .waitForSelector(selector, { visible: true, timeout: 3000 })
        .catch(() => {
            visible = false;
        });
    return visible;
}

scrapeTerabyte().then(products => {
    console.log('Produtos extraídos:', products);
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
}).catch(error => {
    console.error('Erro durante o scraping:', error);
});
