import { enablePolkadotSnap, getInjectedMetamaskExtension } from '@chainsafe/metamask-polkadot-adapter';
import { connectMetaMask, connectPolkadot, HTTP_RPC_URL, WS_RPC_URL } from './common';
import { web3EnablePromise } from '@polkadot/extension-dapp';


const SNAP_ID = 'npm:@chainsafe/polkadot-snap';

export async function run() {
    // throws an error if we set ws enpoint to wsRpcUrl instead of http endpoint...
    const snap = await enablePolkadotSnap({ networkName: 'Atleta', wsRpcUrl: HTTP_RPC_URL }, SNAP_ID);
    const snapApi = snap.getMetamaskSnapApi();
    console.log(await snapApi.getLatestBlock());

    const polkadotApi = await connectPolkadot();
    const address = await getAddress(snapApi);
    const remark = await createRemarkPayload(polkadotApi, address, "hello from metamask");
    const signature = await snapApi.signPayloadJSON(remark);
}

async function createRemarkPayload(api, address, message) {
    // fetch last signed block
    const signedBlock = await api.rpc.chain.getBlock();

    // create signer options
    const nonce = (await api.derive.balances.account(address)).accountNonce;
    const signerOptions = {
        blockHash: signedBlock.block.header.hash,
        era: api.createType('ExtrinsicEra', {
            current: signedBlock.block.header.number,
            period: 60
        }),
        nonce
    };

    const tx = api.tx.system.remark(message);
    return api.createType('SignerPayload', {
        genesisHash: api.genesisHash,
        runtimeVersion: api.runtimeVersion,
        version: api.extrinsicVersion,
        ...signerOptions,
        address,
        blockNumber: signedBlock.block.header.number,
        method: tx.method,
        signedExtensions: [],
        transactionVersion: tx.version
    });
}

async function getAddress(snapApi) {
    return (await snapApi.getPublicKey()).slice(0, 42);
}
