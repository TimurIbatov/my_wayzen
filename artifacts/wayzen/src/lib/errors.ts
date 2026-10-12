export const showErrorText = (error: unknown) => error instanceof Error ? error.message : 'Не удалось загрузить данные. Попробуйте ещё раз.';
