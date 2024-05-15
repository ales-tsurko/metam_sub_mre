import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types/create';
import { blake2AsHex } from '@polkadot/util-crypto';

document.getElementById('signButton').addEventListener('click', async () => {
    await connect();
    const statusElement = document.getElementById('status');
    statusElement.innerText = 'Connecting to Substrate...';

    const provider = new WsProvider('ws://185.190.140.207:9944');
    const api = await ApiPromise.create({
        provider,
        types: {
            "AccountId": "EthereumAccountId",
            "Address": "AccountId",
            "Balance": "u128",
            "RefCount": "u8",
            "LookupSource": "AccountId",
            "Account": {
                "nonce": "U256",
                "balance": "u128"
            },
            "EthTransaction": "LegacyTransaction",
            "DispatchErrorModule": "DispatchErrorModuleU8",
            "EthereumSignature": {
                "r": "H256",
                "s": "H256",
                "v": "U8"
            },
            "ExtrinsicSignature": "EthereumSignature",
            "TxPoolResultContent": {
                "pending": "HashMap<H160, HashMap<U256, PoolTransaction>>",
                "queued": "HashMap<H160, HashMap<U256, PoolTransaction>>"
            },
            "TxPoolResultInspect": {
                "pending": "HashMap<H160, HashMap<U256, Summary>>",
                "queued": "HashMap<H160, HashMap<U256, Summary>>"
            },
            "TxPoolResultStatus": {
                "pending": "U256",
                "queued": "U256"
            },
            "Summary": "Bytes",
            "PoolTransaction": {
                "hash": "H256",
                "nonce": "U256",
                "blockHash": "Option<H256>",
                "blockNumber": "Option<U256>",
                "from": "H160",
                "to": "Option<H160>",
                "value": "U256",
                "gasPrice": "U256",
                "gas": "U256",
                "input": "Bytes"
            }
        }
    });

    statusElement.innerText = 'Preparing transaction...';

    const senderAddress = await getAccount();
    const recipientAddress = '0x05bb06E6981f6B26e5026Dc952860289A5Df9212';
    const amount = 1000000000000n;

    const extrinsic = api.tx.balances.transferAllowDeath(recipientAddress, amount);
    const blockHash = await api.rpc.chain.getBlockHash();
    const { number: currentBlock } = await api.rpc.chain.getHeader();
    const nonce = (await api.query.system.account(senderAddress)).nonce.toNumber();

    const era = api.createType('ExtrinsicEra', {
        current: currentBlock,
        period: 64,
    });

    const payload = api.createType('ExtrinsicPayload', {
        blockHash,
        era,
        genesisHash: api.genesisHash,
        method: extrinsic.method,
        nonce,
        specVersion: api.runtimeVersion.specVersion,
        tip: 0,
        transactionVersion: api.runtimeVersion.transactionVersion,
    }, { version: api.extrinsicVersion });

    const payloadU8a = payload.toU8a(true);
    const payloadHash = blake2AsHex(payloadU8a);

    statusElement.innerText = 'Requesting signature from MetaMask...';

    if (window.ethereum) {
        try {
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [payloadHash, senderAddress],
            });

            statusElement.innerText = 'Signature received. Sending transaction...';

            const signatureBuffer = hexToU8a(signature.slice(2));

            // Correctly format the signature into the required EcdsaSignature structure
            const v = signatureBuffer[64] < 27 ? signatureBuffer[64] + 27 : signatureBuffer[64];
            const formattedSignature = new Uint8Array(65);
            formattedSignature.set(signatureBuffer.slice(0, 64), 0);
            formattedSignature[64] = v;

            extrinsic.addSignature(
                senderAddress,
                u8aToHex(formattedSignature),
                payloadU8a
            );

            const result = await api.rpc.author.submitExtrinsic(extrinsic.toHex());

            statusElement.innerText = `Transaction result: ${result}`;
        } catch (error) {
            statusElement.innerText = `Error: ${error.message}`;
            console.error('Error signing or sending transaction:', error);
        }
    } else {
        statusElement.innerText = 'MetaMask is not installed.';
        console.error('MetaMask is not installed.');
    }
});

async function getAccount() {
    const accounts = await window
        .ethereum
        .request({ method: "eth_requestAccounts" })
        .catch((err) => {
            if (err.code === 4001) {
                console.log("Please connect to MetaMask.");
            } else {
                console.error(err);
            }
        });
    return accounts[0];
}

async function connect() {
    try {
        await window
            .ethereum
            .request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: '0x924' }],
            });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window
                    .ethereum
                    .request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: '0x924',
                                chainName: "Atleta",
                                rpcUrls: ["http://185.190.140.207:9944"],
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
