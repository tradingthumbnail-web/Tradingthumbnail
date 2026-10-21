import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default defineNuxtPlugin(() => {
    const driverInstance = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        allowClose: false,
        smoothScroll: true,
        animate: true
    })

    return {
        provide: {
            driver: driverInstance,
        },
    }
});