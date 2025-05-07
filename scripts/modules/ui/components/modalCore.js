// @file: /scripts/modules/ui/components/modalCore.js
// @version: 1.1 – low-level modal container, backdrop, ESC, focus-trap
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

/**
 * Creates the bare modal element with backdrop, ESC-to-close, focus trapping,
 * and exposes open/close/openAt methods. Includes a header placeholder div
 * for title/search injection.
 *
 * @param {object} options
 * @param {string} options.id           – DOM id for the modal container
 * @param {'small'|'large'} [options.size='small'] – size variant
 * @param {boolean} [options.backdrop=true]        – whether to show a dark backdrop
 * @param {() => void} [options.onClose]           – callback after modal closes
 * @returns {{
*   modal: HTMLElement,
*   header: HTMLElement,
*   content: HTMLElement,
*   open: () => void,
*   close: () => void,
*   openAt: (x: number, y: number) => void
* }}
*/
export function createModalCore({
 id,
 size = 'small',
 backdrop = true,
 onClose,
}) {
 // --- 1) Build DOM ---
 const modal = document.createElement('div');
 modal.id = id;
 modal.classList.add('modal', `modal-${size}`);
 Object.assign(modal.style, {
   display: 'none',
   position: 'fixed',
   top: '0',
   left: '0',
   right: '0',
   bottom: '0',
   backgroundColor: backdrop ? 'rgba(0,0,0,0.5)' : 'transparent',
   zIndex: '9999',
 });
 modal.tabIndex = -1;

 const content = document.createElement('div');
 content.classList.add('modal-content');
 Object.assign(content.style, {
   width: size === 'large' ? '600px' : '360px',
   maxWidth: '95%',
   margin: 'auto',
   position: 'relative',
   top: size === 'large' ? '50%' : '20%',
   transform: size === 'large' ? 'translateY(-50%)' : 'translateY(0)',
   backgroundColor: '#fff',
   outline: 'none',
 });

 // Prevent clicks inside from closing
 content.addEventListener('click', e => e.stopPropagation());

 // Header placeholder
 const header = document.createElement('div');
 header.classList.add('modal-header');
 content.appendChild(header);

 modal.appendChild(content);
 document.body.appendChild(modal);

 // --- 2) Focus trapping & lifecycle ---
 let lastFocused = null;
 function trapFocus(e) {
   const focusable = modal.querySelectorAll(
     'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
   );
   if (!focusable.length) return;
   const first = focusable[0];
   const last = focusable[focusable.length - 1];
   if (e.key === 'Tab') {
     if (e.shiftKey && document.activeElement === first) {
       e.preventDefault();
       last.focus();
     } else if (!e.shiftKey && document.activeElement === last) {
       e.preventDefault();
       first.focus();
     }
   }
 }

 function handleKeydown(e) {
   if (e.key === 'Escape') {
     close();
   } else if (e.key === 'Tab') {
     trapFocus(e);
   }
 }

 function handleBackdropClick() {
   close();
 }

 // --- 3) Open/Close methods ---
 function open() {
   lastFocused = document.activeElement;
   document.body.style.overflow = 'hidden';

   modal.style.display = 'block';
   modal.focus();

   modal.addEventListener('click', handleBackdropClick);
   document.addEventListener('keydown', handleKeydown);

   // focus first focusable inside after render
   setTimeout(() => {
     const target = content.querySelector('input, button, [tabindex]') || content;
     target.focus();
   }, 0);
 }

 function close() {
   modal.style.display = 'none';

   modal.removeEventListener('click', handleBackdropClick);
   document.removeEventListener('keydown', handleKeydown);

   document.body.style.overflow = '';
   lastFocused?.focus?.();
   onClose?.();
 }

 function openAt(x, y) {
   open();
   Object.assign(content.style, {
     position: 'absolute',
     left: `${x}px`,
     top: `${y}px`,
     transform: 'translate(0, 0)',
   });
 }

 return { modal, header, content, open, close, openAt };
}
