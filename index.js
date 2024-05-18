import { ApiPromise, WsProvider } from '@polkadot/api';

document.getElementById('signButton').addEventListener('click', async () => {
    const statusElement = document.getElementById('status');
    statusElement.innerText = 'Preparing transaction...';

    try {
        const api = await connect();
        const call = await constructRemarkCall(api);
        const precompileAddress = '0x0000000000000000000000000000000000000006';

        statusElement.innerText = 'Sending transaction...';

        if (window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const from = accounts[0];

            console.log('Using account:', from);

            // Prepare the transaction parameters
            const nonce = await window.ethereum.request({
                method: 'eth_getTransactionCount',
                params: [from, 'latest'],
            });

            const txParams = {
                from,
                to: precompileAddress,
                value: 0,
                data: call,
                gas: '75000000',
                gasPrice: '21000',
                nonce,
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
});

async function connect() {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: '0x643' }],
        });

        const provider = new WsProvider('ws://127.0.0.1:9944');
        const api = await ApiPromise.create({
            provider,
            types: {
                AccountId: "EthereumAccountId",
                Address: "AccountId",
                Balance: "u128",
                RefCount: "u8",
                LookupSource: "AccountId",
                Account: {
                    nonce: "U256",
                    balance: "u128"
                },
                EthTransaction: "LegacyTransaction",
                DispatchErrorModule: "DispatchErrorModuleU8",
                EthereumSignature: {
                    r: "H256",
                    s: "H256",
                    v: "U8"
                },
                ExtrinsicSignature: "EthereumSignature",
                TxPoolResultContent: {
                    pending: "HashMap<H160, HashMap<U256, PoolTransaction>>",
                    queued: "HashMap<H160, HashMap<U256, PoolTransaction>>"
                },
                TxPoolResultInspect: {
                    pending: "HashMap<H160, HashMap<U256, Summary>>",
                    queued: "HashMap<H160, HashMap<U256, Summary>>"
                },
                TxPoolResultStatus: {
                    pending: "U256",
                    queued: "U256"
                },
                Summary: "Bytes",
                PoolTransaction: {
                    hash: "H256",
                    nonce: "U256",
                    blockHash: "Option<H256>",
                    blockNumber: "Option<U256>",
                    from: "H160",
                    to: "Option<H160>",
                    value: "U256",
                    gasPrice: "U256",
                    gas: "U256",
                    input: "Bytes"
                }
            }
        });

        return api;

    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: '0x643',
                            chainName: "Atleta",
                            rpcUrls: ["http://127.0.0.1:9944"],
                        },
                    ],
                });
            } catch (addError) {
                console.error('Error adding Ethereum chain:', addError);
            }
        } else {
            console.error('Error switching Ethereum chain:', switchError);
        }
    }
}

async function constructRemarkCall(api) {
    const remarkMessage = 'Fuck You!';
    const call = api.tx.system.remark(remarkMessage);

    // Encode the call
    const hexCall = Buffer.from(call.toU8a()).toString('hex');
    return hexCall;
}

async function constructTransferCall(api) {
    const recipient = '0x016EdF4FDb344FEB3743De09d91eb0311D14fF85'; // Replace with a valid recipient address
    const amount = '0x16345785d8a0000'; // 1 ether in wei

    const call = api.tx.balances.transferAllowDeath(recipient, amount);

    // Encode the call
    const hexCall = call.toHex();
    return hexCall;
}
