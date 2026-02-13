import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relativeTime plugin for fromNow() support
dayjs.extend(relativeTime);

export { dayjs };
export default dayjs;
