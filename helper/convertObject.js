exports.convert = (arr) => {
    if(arr == []){
        return;
    }

    let arrResult = [];

    for(const obj of arr){
        const x = obj.vista.boundingBox.left 
        const y =  obj.vista.boundingBox.top - 150
        const adsinfo = [{
            focal_point: [x,y],
            description: obj.affiliate['Description'],
            name: obj.affiliate['Merchant Product Name'],
            url:  obj.affiliate['Image URL'],
            product_price: obj.affiliate['Price'],
            product_price_discounted: obj.affiliate['Discounted Price'],
            product_url: obj.affiliate['Product URL Web (encoded)'],
            iframe: `<div class="s-expand-height s-include-content-margin s-border-bottom s-latency-cf-section">\r\n<div class="a-section a-spacing-medium">\r\n\r\n\r\n<div class="a-section a-spacing-micro s-grid-status-badge-container">\r\n\r\n</div>\r\n\r\n\r\n<span data-component-type="s-product-image" class="rush-component" data-component-id="10">\r\n\r\n<a class="a-link-normal s-no-outline" href="${obj.affiliate['Product URL Web (encoded)']}">\r\n<div class="a-section aok-relative s-image-square-aspect">\r\n\r\n\r\n\r\n<img src="${obj.affiliate['Image URL']}" class="s-image" alt="${obj.affiliate['Merchant Product Name']}" srcset="${obj.affiliate['Image URL']} 1x, https://m.media-amazon.com/images/I/81SSoagYm3L._MCnd_AC_UL480_FMwebp_QL65_.jpg 1.5x, https://m.media-amazon.com/images/I/81SSoagYm3L._MCnd_AC_UL640_FMwebp_QL65_.jpg 2x, https://m.media-amazon.com/images/I/81SSoagYm3L._MCnd_AC_UL800_FMwebp_QL65_.jpg 2.5x, https://m.media-amazon.com/images/I/81SSoagYm3L._MCnd_AC_UL960_FMwebp_QL65_.jpg 3x" data-image-index="1" data-image-load="" data-image-latency="s-product-image" data-image-source-density="1">\r\n\r\n\r\n</div>\r\n</a>\r\n</span>\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-small">\r\n\r\n<h2 class="a-size-mini a-spacing-none a-color-base s-line-clamp-4">\r\n\r\n\r\n\r\n<a class="a-link-normal a-text-normal" href="${obj.affiliate['Product URL Web (encoded)']}">\r\n\r\n\r\n\r\n<span class="a-size-base-plus a-color-base a-text-normal" dir="auto">${obj.affiliate['Merchant Product Name']}</span>\r\n\r\n\r\n\r\n\r\n</a>\r\n\r\n\r\n</h2>\r\n\r\n</div>\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-small">\r\n<span aria-label="${obj.affiliate['Available']} Available">\r\n\r\n\r\n\r\n\r\n<span class="a-declarative" data-action="a-popover" data-a-popover="{&quot;max-width&quot;:&quot;700&quot;,&quot;closeButton&quot;:false,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;url&quot;:&quot;/review/widgets/average-customer-review/popover/ref=acr_search__popover?ie=UTF8&amp;asin=B07Q2H7JMM&amp;ref=acr_search__popover&amp;contextId=search&quot;}">\r\n\r\n\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><h3>Discounted Price: ${obj.affiliate['Price Unit']} ${obj.affiliate['Discounted Price']}</h3></div>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><span class="a-size-small a-color-secondary" dir="auto">Regular Price: ${obj.affiliate['Price Unit']} ${obj.affiliate['Price']}</span></div>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><span class="a-size-small a-color-secondary" dir="auto">${obj.affiliate['Available']} Available</span></div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n</div>\r\n</div>`
        }]
        arrResult.push({adsinfo: adsinfo})
    }
    return arrResult
};