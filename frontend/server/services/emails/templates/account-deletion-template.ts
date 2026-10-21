export const getAccountDeletionTemplate = (locale: string) => {
    switch (locale) {
        case 'es':
            return ACCOUNT_DELETION_EMAIL_ES;
        case 'en':
            return ACCOUNT_DELETION_EMAIL_EN;
        case 'ca':
            return ACCOUNT_DELETION_EMAIL_CA;
        default:
            return ACCOUNT_DELETION_EMAIL_EN;
    }
};

const ACCOUNT_DELETION_EMAIL_ES = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu cuenta ha sido eliminada - ClickLab</title>
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
            .logo svg {
                height: 40px;
                display: block;
                margin: 0 auto;
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
            .feature {
                margin-bottom: 24px;
                display: flex;
                align-items: flex-start;
                gap: 16px;
            }
            .feature-icon {
                width: 32px;
                height: 32px;
                background-color: #6C5DD3;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            .feature-text {
                flex: 1;
            }
            .feature-text h3 {
                color: #ffffff;
                margin: 0 0 8px 0;
            }
            .feature-text p {
                color: #B4B4B4;
                margin: 0;
            }
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
            }
            .notice {
                font-size: 14px;
                color: #B4B4B4;
                margin-top: 24px;
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
                <h1>Tu cuenta ha sido eliminada</h1>
                <p>Este correo ha sido enviado para confirmar que tu cuenta ha sido eliminada con éxito, y todos tus datos han sido borrados de nuestro sistema. Queremos aprovechar para darte las gracias por haber sido parte de ClickLab, y esperamos verte en el futuro.</p>
            </div>
            <div class="footer">
                <p>Este correo fue enviado a {{email}} porque eres usuario de ClickLab.</p>
                <p>© ${new Date().getFullYear()} ClickLab. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
</html>
`;

const ACCOUNT_DELETION_EMAIL_EN = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your account has been deleted - ClickLab</title>
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
            .logo svg {
                height: 40px;
                display: block;
                margin: 0 auto;
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
            .feature {
                margin-bottom: 24px;
                display: flex;
                align-items: flex-start;
                gap: 16px;
            }
            .feature-icon {
                width: 32px;
                height: 32px;
                background-color: #6C5DD3;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            .feature-text {
                flex: 1;
            }
            .feature-text h3 {
                color: #ffffff;
                margin: 0 0 8px 0;
            }
            .feature-text p {
                color: #B4B4B4;
                margin: 0;
            }
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
            }
            .notice {
                font-size: 14px;
                color: #B4B4B4;
                margin-top: 24px;
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
                <h1>Your account has been deleted</h1>
                <p>This email has been sent to confirm that your account has been deleted successfully, and all your data has been deleted from our system. We want to take this opportunity to thank you for being part of ClickLab, and we hope to see you in the future.</p>
            </div>
            <div class="footer">
                <p>This email was sent to {{email}} because you are a user of ClickLab.</p>
                <p>© ${new Date().getFullYear()} ClickLab. All rights reserved.</p>
            </div>
        </div>
    </body>
</html>
`;

const ACCOUNT_DELETION_EMAIL_CA = `
    <!DOCTYPE html>
    <html lang="ca">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>La teva compta ha estat eliminada - ClickLab</title>
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
            .logo svg {
                height: 40px;
                display: block;
                margin: 0 auto;
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
            .feature {
                margin-bottom: 24px;
                display: flex;
                align-items: flex-start;
                gap: 16px;
            }
            .feature-icon {
                width: 32px;
                height: 32px;
                background-color: #6C5DD3;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            .feature-text {
                flex: 1;
            }
            .feature-text h3 {
                color: #ffffff;
                margin: 0 0 8px 0;
            }
            .feature-text p {
                color: #B4B4B4;
                margin: 0;
            }
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
            }
            .notice {
                font-size: 14px;
                color: #B4B4B4;
                margin-top: 24px;
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
                <h1>La teva compta ha estat eliminada</h1>
                <p>Aquest correu electrònic ha estat enviat per confirmar que la teva compta ha estat eliminada correctament, i totes les teves dades han estat eliminades del nostre sistema. Volem aprofitar aquesta oportunitat per agraïr-te que hagis format part de ClickLab, i esperam que tornis aviat.</p>
            </div>
            <div class="footer">
                <p>Aquest correu electrònic ha estat enviat a {{email}} perquè eres un usuari de ClickLab.</p>
                <p>© ${new Date().getFullYear()} ClickLab. Tots els drets reservats.</p>
            </div>
        </div>
    </body>
</html>
`;