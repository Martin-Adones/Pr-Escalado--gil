/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'pdae-ticket': (parsed, when = 'always') => {
          const header = typeof parsed?.header === 'string' ? parsed.header : '';
          const ticketPattern = /PDAE-[0-9]+/;
          const hasTicket = ticketPattern.test(header);
          if (when === 'never') {
            return [
              !hasTicket,
              hasTicket
                ? 'El mensaje no debe incluir el patrón PDAE-[0-9]+.'
                : '',
            ];
          }
          return [
            hasTicket,
            hasTicket
              ? ''
              : 'El mensaje debe incluir el ticket PDAE-<número> (ej: feat: PDAE-123 login logic).',
          ];
        },
      },
    },
  ],
  rules: {
    // El ticket PDAE-NNN va en mayúsculas; el preset convencional prohíbe mayúsculas en el subject.
    'subject-case': [0],
    'pdae-ticket': [2, 'always'],
  },
};
