import { connectMetaMask, connectPolkadot } from './common';

export async function run() {
    const statusElement = document.getElementById('status');
    statusElement.innerText = 'Preparing transaction...';
    const polkadotApi = await connectPolkadot();

    try {
        await connectMetaMask();

        const call = await constructRemarkCall(polkadotApi);
        console.log("hexCall", call);
        const precompileAddress = '0x0000000000000000000000000000000000000006';

        statusElement.innerText = 'Sending transaction...';

        if (window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const from = accounts[0];

            console.log('Using account:', from);

            // Prepare the transaction parameters
            const txParams = {
                from,
                to: precompileAddress,
                data: call,
                value: "123123123",
                gas: "1231231100",
                gasPrice: "1231241123123",
            };

            console.log('Transaction parameters:', txParams);

            // Send the transaction using MetaMask
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });

            console.log('Transaction sent with hash:', txHash);
            statusElement.innerText = `Transaction sent with hash: ${txHash}`;
        } else {
            statusElement.innerText = 'MetaMask is not installed.';
            console.error('MetaMask is not installed.');
        }
    } catch (error) {
        statusElement.innerText = 'Error sending transaction.';
        console.error('Error sending transaction:', error);
    }
    
}

async function constructRemarkCall(api) {
    const remarkMessage = 'Hello, My Lovely Friend!';
    const call = api.tx.system.remark(remarkMessage);

    // Encode the call
    const hexCall = call.toHex();
    return hexCall;
}

async function constructTransferCall(api) {
    const recipient = '0x016EdF4FDb344FEB3743De09d91eb0311D14fF85';
    const amount = '0x16345785d8a0000'; // 1 ether in wei

    const call = api.tx.balances.transferAllowDeath(recipient, amount);

    // Encode the call
    const hexCall = call.toHex();
    return hexCall;
}
