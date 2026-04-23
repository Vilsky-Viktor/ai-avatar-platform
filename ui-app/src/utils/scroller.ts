export const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight - 20, behavior: 'smooth' });
}

export const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}