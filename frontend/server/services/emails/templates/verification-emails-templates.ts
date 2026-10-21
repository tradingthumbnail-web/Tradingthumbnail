export const getValidationEmailTemplate = (locale: string) => {
    switch (locale) {
        case 'es':
            return VALIDATE_USER_EMAIL_ES;
        case 'en':
            return VALIDATE_USER_EMAIL_EN;
        case 'ca':
            return VALIDATE_USER_EMAIL_CA;
        default:
            return VALIDATE_USER_EMAIL_EN;
    }
};

const VALIDATE_USER_EMAIL_ES = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma tu registro - ClickLab</title>
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
            .logo img {
                height: 40px;
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
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
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
                <h1>{{username}} - Confirma tu correo electrónico</h1>
                <p>Gracias por registrarte en ClickLab. Para completar tu registro y comenzar a crear miniaturas impactantes, por favor confirma tu dirección de correo electrónico.</p>
                <a href="{{verificationLink}}" class="button">Confirmar correo electrónico</a>
            </div>
            <div class="footer">
                <p>Este correo fue enviado a {{email}} porque tienes una cuenta en ClickLab.</p>
                <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
`;

const VALIDATE_USER_EMAIL_EN = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm your registration - ClickLab</title>
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
            .logo img {
                height: 40px;
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
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
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
                <h1>Confirm your email</h1>
                <p>Thank you for registering on ClickLab. To complete your registration and start creating stunning thumbnails, please confirm your email address.</p>
                <a href="{{verificationLink}}" class="button">Confirm your email</a>
            </div>
            <div class="footer">
                <p>This email was sent to {{email}} because you registered on ClickLab.</p>
                <p>If you did not create this account, you can ignore this message.</p>
            </div>
        </div>
    </body>
    </html>
`;

const VALIDATE_USER_EMAIL_CA = `
    <!DOCTYPE html>
    <html lang="ca">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma el teu registre - ClickLab</title>
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
            .logo img {
                height: 40px;
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
            .button {
                display: inline-block;
                background-color: #6C5DD3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                font-weight: 500;
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
                <h1>Confirma el teu email</h1>
                <p>Gràcies per registrar-te a ClickLab. Per a completar el teu registre i començar a crear miniatures impressionants, per favor confirma la teva adreça de correu electrònic.</p>
                <a href="{{verificationLink}}" class="button">Confirma el teu email</a>
            </div>
            <div class="footer">
                <p>Aquest correu electrònic ha estat enviat a {{email}} perquè has registrat-te a ClickLab.</p>
                <p>Si no has creat aquesta compta, pots ignorar aquest missatge.</p>
            </div>
        </div>
    </body>
    </html>
`;