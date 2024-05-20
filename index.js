import { run as runSnap } from './snap';
import { run as runNative } from './native';

document.getElementById('signButton').addEventListener('click', async () => {
    await runSnap();
    // await runNative();
});
