import { CLICKLAB_PRODUCT_NAME } from './brand';

/** Browser tab title suffix for user-facing pages. */
export function clicklabPageTitle(page: string): string {
  return `${page} | ${CLICKLAB_PRODUCT_NAME}`;
}
