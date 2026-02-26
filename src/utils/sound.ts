export const playNotificationSound = () => {
  try {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.error('Audio play failed', e));
  } catch (e) {
    console.error('Audio play failed', e);
  }
};
