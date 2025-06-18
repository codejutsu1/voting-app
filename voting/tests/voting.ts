import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import { expect } from "chai";
import { beforeEach } from "mocha";
import IDL from '../target/idl/voting.json';


const votingAddress = new PublicKey("DXfHDzKXYgyEcQBTpKVoviitJa8RWHwhYkL5imNsb5wy");

describe("voting", () => {
  let context;
  let provider;
  let votingProgram;

  beforeEach(async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  });
   
  it("initialized poll", async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favourite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1850220940)
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
       [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).equal(1);
    expect(poll.description).equal("What is your favourite type of peanut butter?");
    expect(poll.pollStart.toNumber()).lessThan(poll.pollEnd.toNumber());
  });

  it("initialize candidate", async() => {
    const poll_id = new anchor.BN(1);
    const description = "What is your favorite cryptocurrency?";
    const poll_start = new anchor.BN(0);
    const poll_end = new anchor.BN(1850220940);

  await votingProgram.methods.initializePoll(
    poll_id, 
    description, 
    poll_start, 
    poll_end
  ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Daniel.sol",
      new anchor.BN(1)
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Daniel.eth",
      new anchor.BN(1)
    ).rpc();

    const [danielSolAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Daniel.sol")],
      votingAddress
    );

    const danielSolCandidate = await votingProgram.account.candidate.fetch(danielSolAddress);

    console.log(danielSolCandidate);
    expect(danielSolCandidate.candidateVotes.toNumber()).equal(0);

     const [danielEthAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Daniel.eth")],
      votingAddress
    );

    const danielEthCandidate = await votingProgram.account.candidate.fetch(danielEthAddress);

    console.log(danielEthCandidate);
     expect(danielEthCandidate.candidateVotes.toNumber()).equal(0);
  });

  it("vote", async() => {
     await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favourite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1850220940)
    ).rpc();

     await votingProgram.methods.initializeCandidate(
      "Daniel.solana",
      new anchor.BN(1)
    ).rpc();

    await votingProgram.methods
     .vote(
        "Daniel.solana",
        new anchor.BN(1)
     ).rpc();

      const [danielSolAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Daniel.solana")],
      votingAddress
    );

    const danielSolCandidate = await votingProgram.account.candidate.fetch(danielSolAddress);

    console.log(danielSolCandidate);
    expect(danielSolCandidate.candidateVotes.toNumber()).equal(1);
  })
});
