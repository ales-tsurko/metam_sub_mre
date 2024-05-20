import { ApiPromise, WsProvider } from '@polkadot/api';

export const WS_RPC_URL = 'wss://testnet-rpc.atleta.network:9944';
export const HTTP_RPC_URL = 'https://testnet-rpc.atleta.network:9944';
export const CHAIN_PARAMS = {
    chainId: '0x643', // 1603
    chainName: "Atleta",
};

export async function connectMetaMask() {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: '0x643' }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            ...CHAIN_PARAMS,
                            rpcUrls: [HTTP_RPC_URL],
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

export function connectPolkadot() {
    const provider = new WsProvider(WS_RPC_URL);
    return ApiPromise.create({
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
}

export function hasMetaMask() {
    return window.ethereum && window.ethereum.isMetaMask;
}
