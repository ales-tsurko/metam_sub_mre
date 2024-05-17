import { ApiPromise, WsProvider } from '@polkadot/api';

// Event listener for the button
document.getElementById('signButton').addEventListener('click', async () => {
    const api = await connect();
    const statusElement = document.getElementById('status');

    statusElement.innerText = 'Preparing transaction...';

    const call = await constructRemarkCall(api); // Changed function name to match the call
    const precompileAddress = '0x0000000000000000000000000000000000000006';

    statusElement.innerText = 'Sending transaction...';

    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const from = accounts[0];
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from,
                    to: precompileAddress,
                    data: call,
                    gas: '6000000', // Adjust gas limit as needed
                }],
            });
            console.log('Transaction sent with hash:', txHash);
            statusElement.innerText = `Transaction sent with hash: ${txHash}`;
        } catch (error) {
            statusElement.innerText = 'Error sending transaction.';
            console.error('Error sending transaction:', error);
        }
    } else {
        statusElement.innerText = 'MetaMask is not installed.';
        console.error('MetaMask is not installed.');
    }
});

// Function to connect to the Substrate node
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

// Function to construct the remark call
async function constructRemarkCall(api) {
    const remarkMessage = 'Hello, Substrate!';
    const call = api.tx.system.remark(remarkMessage);

    // Encode the call
    return call.toHex();
}
