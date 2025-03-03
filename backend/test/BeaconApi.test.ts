import { jest } from "@jest/globals";
import {hexToBytes} from "viem";
import {plainToInstance} from "class-transformer";
import {success} from "../src/core/result.js";
import {BeaconBlobSidecar, BeaconBlobSidecarResponse} from "../src/api/models.js";
import {BeaconApi} from "../src/api/BeaconApi.js";
import axios from "axios";

// NOTE: If we were to use required .env variables, we should mock them before importing BeaconApi
describe("BeaconApi Unit Tests", () => {
    test("getBlobVersionedHash should calculate the blob versioned hash correctly", async () => {
        const blobMock = new BeaconBlobSidecar(
            0,
            hexToBytes("0x1"), // blob
            hexToBytes("0xb3bb33b8386ad564ed5a468e6e324d9ca85f2024691e3fd2d5675f15adb425d78b117c1580eb94c98fb7eca2f01d8fee"), // kzgCommitment
            hexToBytes("0x2"), // kzgProof
            {} as any,
            []
        );

        expect(blobMock.getBlobVersionedHash()).toStrictEqual("0x0130c6bee3de52c1c8f2c563e92db5b42867a75f553a29a7172a83aa9e2b0dac");
    });

    describe("blobAsBytes should return byte array representation of the blob without trailing zero 32 byte chunks", () => {
        test("Blob without trailing zero 32 byte chunks", () => {
            const blobMock = new BeaconBlobSidecar(
                0,
                hexToBytes("0x00a01afc010085dc08cc6410f8ab0484060523408302834894c7d67a9cbb121b003b0b9c053dd9f469523243379a80b844a9059cbb002b29899a6a5f8725ed5b"), // blob without trailing zero chunks
                hexToBytes("0x1"), // unused kzgCommitment
                hexToBytes("0x2"), // unused kzgProof
                {} as any,
                []
            );

            const trimmedBlob = blobMock.blobAsBytesTrimmed();
            expect(trimmedBlob).toStrictEqual(hexToBytes("0x00a01afc010085dc08cc6410f8ab0484060523408302834894c7d67a9cbb121b003b0b9c053dd9f469523243379a80b844a9059cbb002b29899a6a5f8725ed5b"));
        });

        test("Blob with 32 byte trailing zero chunks", () => {
            const blobMock = new BeaconBlobSidecar(
                0,
                hexToBytes("0x00a01afc010085000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"), // blob with trailing zero chunks
                hexToBytes("0x1"), // unused kzgCommitment
                hexToBytes("0x2"), // unused kzgProof
                {} as any,
                []
            );

            const trimmedBlob = blobMock.blobAsBytesTrimmed();
            expect(trimmedBlob).toStrictEqual(hexToBytes("0x00a01afc01008500000000000000000000000000000000000000000000000000"));
        });
    });

    test("BeaconApi should map all fields correctly", async () => {
        const beaconClientMock = new BeaconApi(axios.create());
        const mockResponse = success(plainToInstance(BeaconBlobSidecarResponse, block_21872276_sidecars_response));
        jest.spyOn(beaconClientMock, 'getBlobSidecars').mockResolvedValue(mockResponse);

        const blobsResult = await beaconClientMock.getBlobSidecars("");
        const blobs = blobsResult.unwrap().data;

        expect(blobs).toHaveLength(1);
        const blob = blobs[0];

        expect(blob.index).toBe(0); // Is a number
        expect(blob.blob).toStrictEqual(hexToBytes("0x00a01afc010085dc08cc6410f8ab0484060523408302834894c7d67a9cbb121b003b0b9c053dd9f469523243379a80b844a9059cbb002b29899a6a5f8725ed5b")); // is ByteArray
        expect(blob.kzgCommitment).toStrictEqual(hexToBytes("0xb3bb33b8386ad564ed5a468e6e324d9ca85f2024691e3fd2d5675f15adb425d78b117c1580eb94c98fb7eca2f01d8fee"));
        expect(blob.kzgProof).toStrictEqual(hexToBytes("0x9610e086176c614c4dd16f455081494a1fe7639cf0c3dec3f80c88d6a14df09c163d310f2ab5af5a05aa6953f7b1d2fe"));

        const signedBlockHeader = blob.signedBlockHeader;
        expect(signedBlockHeader.message.slot).toBe(11087151);
        expect(signedBlockHeader.message.proposerIndex).toBe(506459);
        expect(signedBlockHeader.message.parentRoot).toStrictEqual("0x18a2d4c4d5c72a3e138e9e783551fddb6b61a5836ca23eef5cc8f0f51201501a");
        expect(signedBlockHeader.message.stateRoot).toStrictEqual("0x7b5cd3d9401bb021ea8fb019dc9bd454b53735b71886b3358b2e9393600ee943");
        expect(signedBlockHeader.message.bodyRoot).toStrictEqual("0x8163decf858aaaa6f73019efd223d058fe87e02073304276ea2c28917541a619");
        expect(signedBlockHeader.signature).toStrictEqual(hexToBytes("0xa4d752c79c5adf2520a597426baa3dfecd4b7495b41647b4daeeda8602f8e5de9aacebfb56fa93091f3abdfdff9cfd9506e049ccd1ae1b433906b3b3d3d97e648cab4d6f7394033216b61327f22c973b44bf0ac8a0d946358d09c4df032afe46"));

        expect(blob.kzgCommitmentInclusionProof).toHaveLength(17);
        expect(blob.kzgCommitmentInclusionProof[0]).toStrictEqual("0x0000000000000000000000000000000000000000000000000000000000000000");
    });
});

// BeaconApi mock data
const block_21872276_sidecars_response = {
    "data": [
        {
            "index": "0",
            "blob": "0x00a01afc010085dc08cc6410f8ab0484060523408302834894c7d67a9cbb121b003b0b9c053dd9f469523243379a80b844a9059cbb002b29899a6a5f8725ed5b", // First 64 bytes of blob data
            "kzg_commitment": "0xb3bb33b8386ad564ed5a468e6e324d9ca85f2024691e3fd2d5675f15adb425d78b117c1580eb94c98fb7eca2f01d8fee",
            "kzg_proof": "0x9610e086176c614c4dd16f455081494a1fe7639cf0c3dec3f80c88d6a14df09c163d310f2ab5af5a05aa6953f7b1d2fe",
            "signed_block_header": {
                "message": {
                    "slot": "11087151",
                    "proposer_index": "506459",
                    "parent_root": "0x18a2d4c4d5c72a3e138e9e783551fddb6b61a5836ca23eef5cc8f0f51201501a",
                    "state_root": "0x7b5cd3d9401bb021ea8fb019dc9bd454b53735b71886b3358b2e9393600ee943",
                    "body_root": "0x8163decf858aaaa6f73019efd223d058fe87e02073304276ea2c28917541a619"
                },
                "signature": "0xa4d752c79c5adf2520a597426baa3dfecd4b7495b41647b4daeeda8602f8e5de9aacebfb56fa93091f3abdfdff9cfd9506e049ccd1ae1b433906b3b3d3d97e648cab4d6f7394033216b61327f22c973b44bf0ac8a0d946358d09c4df032afe46"
            },
            "kzg_commitment_inclusion_proof": [
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xf5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b",
                "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
                "0xc78009fdf07fc56a11f122370658a353aaa542ed63e44c4bc15ff4cd105ab33c",
                "0x536d98837f2dd165a55d5eeae91485954472d56f246df256bf3cae19352a123c",
                "0x9efde052aa15429fae05bad4d0b1d7c64da64d03d7a1854a588c2cb8430c0d30",
                "0xd88ddfeed400a8755596b21942c1497e114c302e6118290f91e6772976041fa1",
                "0x87eb0ddba57e35f6d286673802a4af5975e22506c7cf4c64bb6be5ee11527f2c",
                "0x26846476fd5fc54a5d43385167c95144f2643f533cc85bb9d16b782f8d7db193",
                "0x506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1",
                "0xffff0ad7e659772f9534c195c815efc4014ef1e1daed4404c06385d11192e92b",
                "0x6cf04127db05441cd833107a52be852868890e4317e6a02ab47683aa75964220",
                "0x0100000000000000000000000000000000000000000000000000000000000000",
                "0x792930bbd5baac43bcc798ee49aa8185ef76bb3b44ba62b91d86ae569e4bb535",
                "0x40e8a4036e1ede22113c9aba7039c439072c354096baa52009a5f3f77664b691",
                "0xdb56114e00fdd4c1f85c892bf35ac9a89289aaecb1ebd0a96cde606a748b5d71",
                "0xe05500007579265e5be39543554ebbe3bdcc3fdbb1ae19801bffb2dbadd069ba"
            ]
        }
    ]
};