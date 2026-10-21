interface PurchaseConfirmationContent {
    subject: string;
    heading: string;
    message: string;
    productLabel: string;
    amountLabel: string;
    startCreatingButton: string;
    viewReceiptButton: string;
    footerMessage: string;
    footerCopyright: string;
}

const CONTENT: Record<string, PurchaseConfirmationContent> = {
    es: {
        subject: '¡Gracias por tu compra!',
        heading: '¡Gracias por tu compra, {{username}}! 🎉',
        message: 'Tu pago ha sido procesado correctamente.',
        productLabel: 'Producto',
        amountLabel: 'Importe',
        startCreatingButton: 'Empezar a crear',
        viewReceiptButton: 'Ver recibo',
        footerMessage: 'Este correo fue enviado a {{email}} porque eres usuario de ClickLab.',
        footerCopyright: `© ${new Date().getFullYear()} ClickLab. Todos los derechos reservados.`,
    },
    ca: {
        subject: 'Gràcies per la teva compra!',
        heading: 'Gràcies per la teva compra, {{username}}! 🎉',
        message: 'El teu pagament s\'ha processat correctament.',
        productLabel: 'Producte',
        amountLabel: 'Import',
        startCreatingButton: 'Començar a crear',
        viewReceiptButton: 'Veure rebut',
        footerMessage: 'Aquest correu electrònic ha estat enviat a {{email}} perquè ets usuari de ClickLab.',
        footerCopyright: `© ${new Date().getFullYear()} ClickLab. Tots els drets reservats.`,
    },
    en: {
        subject: 'Thank you for your purchase!',
        heading: 'Thank you for your purchase, {{username}}! 🎉',
        message: 'Your payment has been processed successfully.',
        productLabel: 'Product',
        amountLabel: 'Amount',
        startCreatingButton: 'Start creating',
        viewReceiptButton: 'View receipt',
        footerMessage: 'This email was sent to {{email}} because you are a user of ClickLab.',
        footerCopyright: `© ${new Date().getFullYear()} ClickLab. All rights reserved.`,
    },
};

function generatePurchaseTemplate(content: PurchaseConfirmationContent, locale: string): string {
    const lang = locale === 'es' ? 'es' : locale === 'ca' ? 'ca' : 'en';
    
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #1C1B1F;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: #ffffff;
            line-height: 1.5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .logo {
            text-align: center;
            margin: 0 auto 32px auto;
            max-width: 80px;
            color: #fff;
        }
        .card {
            background-color: #2D2B36;
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 24px;
        }
        h1 {
            color: #ffffff;
            font-size: 24px;
            margin: 0 0 16px 0;
        }
        p {
            color: #B4B4B4;
            margin: 0 0 24px 0;
        }
        .purchase-details {
            background-color: #1C1B1F;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .purchase-details .label {
            color: #B4B4B4;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .purchase-details .value {
            color: #ffffff;
            font-size: 16px;
            font-weight: 500;
        }
        .purchase-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #3D3B46;
        }
        .purchase-row:last-child {
            border-bottom: none;
        }
        .button {
            display: inline-block;
            background-color: #6C5DD3;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 500;
            margin-right: 12px;
            margin-bottom: 12px;
        }
        .button-secondary {
            display: inline-block;
            background-color: transparent;
            color: #6C5DD3;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 500;
            border: 1px solid #6C5DD3;
            margin-bottom: 12px;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #B4B4B4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42.03 29.82" style="width: 80px; margin: 0 auto; display: block;">
                <path fill="#FFFFFF" d="M33.2,0H8.83C3.96,0,0,3.96,0,8.83v12.16c0,4.88,3.96,8.83,8.83,8.83h24.36c4.88,0,8.83-3.96,8.83-8.83v-12.16c0-4.88-3.96-8.83-8.83-8.83ZM39.9,20.99c0,3.7-3.01,6.71-6.71,6.71H8.83c-3.7,0-6.7-3.01-6.7-6.71v-12.16c0-3.7,3.01-6.71,6.7-6.71h24.36c3.7,0,6.71,3.01,6.71,6.71v12.16Z"/>
                <path fill="#FFFFFF" d="M25.83,13.56l-7.74-4.47c-.22-.13-.45-.18-.68-.18-.71,0-1.36.57-1.36,1.36v8.94c0,.79.65,1.36,1.36,1.36.23,0,.46-.06.68-.18l7.74-4.47c.91-.52.91-1.83,0-2.36h0ZM18.17,17.88v-6.28l5.43,3.14-5.43,3.14Z"/>
                <circle fill="#FFFFFF" cx="31.78" cy="14.74" r="2.24"/>
                <circle fill="#FFFFFF" cx="10.25" cy="14.74" r="2.24"/>
            </svg>
        </div>
        <div class="card">
            <h1>${content.heading}</h1>
            <p>${content.message}</p>
            
            <div class="purchase-details">
                <div class="purchase-row">
                    <div>
                        <div class="label">${content.productLabel}</div>
                        <div class="value">{{productName}}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">${content.amountLabel}</div>
                        <div class="value">{{amount}}</div>
                    </div>
                </div>
            </div>
            
            <a href="{{appUrl}}/" class="button">${content.startCreatingButton}</a>
            {{#if receiptUrl}}<a href="{{receiptUrl}}" class="button-secondary">${content.viewReceiptButton}</a>{{/if}}
        </div>
        <div class="footer">
            <p>${content.footerMessage}</p>
            <p>${content.footerCopyright}</p>
        </div>
    </div>
</body>
</html>`;
}

export const getPurchaseConfirmationTemplate = (locale: string): string => {
    const content = CONTENT[locale] || CONTENT.en;
    return generatePurchaseTemplate(content, locale);
};