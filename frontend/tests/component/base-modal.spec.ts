// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from '~~/app/components/Base/Modal.vue';

describe('Base/Modal.vue', () => {
  it('renders slot content when modelValue=true', async () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true },
      slots: { default: '<div role="dialog"></div>' },
      global: {
        stubs: {
          Teleport: true
        }
      }
    });

    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
  });

  it('emits close when clicking backdrop (default closeOnBackdrop=true)', async () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true, closeOnBackdrop: true },
      global: {
        stubs: {
            Teleport: true
        }
      },
      attachTo: document.body
    });
    const backdrop = wrapper.find('#modal-backdrop');
    await backdrop.trigger('click');
    expect(wrapper.emitted()['update:modelValue']?.[0]?.[0]).toBe(false);
    expect(wrapper.emitted().close).toBeTruthy();
  });
});


