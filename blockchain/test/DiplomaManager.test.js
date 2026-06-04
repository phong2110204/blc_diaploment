const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DiplomaManager", function () {
  let diplomaManager;
  let owner, issuer, verifier, owner1, owner2, addr1, addr2;

  beforeEach(async function () {
    // Get signers
    [owner, issuer, verifier, owner1, owner2, addr1, addr2] =
      await ethers.getSigners();

    // Deploy contract
    const DiplomaManager = await ethers.getContractFactory("DiplomaManager");
    diplomaManager = await DiplomaManager.deploy();
    await diplomaManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner as admin", async function () {
      expect(await diplomaManager.admin()).to.equal(owner.address);
    });

    it("Should set owner as issuer and verifier", async function () {
      const isIssuer = await diplomaManager.issuers(owner.address);
      const isVerifier = await diplomaManager.verifiers(owner.address);
      expect(isIssuer).to.equal(true);
      expect(isVerifier).to.equal(true);
    });
  });

  describe("Issue Diploma", function () {
    it("Should issue a diploma", async function () {
      const documentHash = ethers.id("test-document");
      const ownerAddress = owner1.address;
      const documentURI = "QmXxxx";
      const documentType = "Bằng Đại Học";

      await expect(
        diplomaManager.issueDiploma(
          documentHash,
          ownerAddress,
          documentURI,
          documentType
        )
      )
        .to.emit(diplomaManager, "DiplomaIssued")
        .withArgs(documentHash, owner.address, ownerAddress, documentType, expect.any(BigInt));

      // Check diploma was created
      const diploma = await diplomaManager.getDiploma(documentHash);
      expect(diploma.owner).to.equal(ownerAddress);
      expect(diploma.issuer).to.equal(owner.address);
      expect(diploma.documentType).to.equal(documentType);
      expect(diploma.isVerified).to.equal(false);
    });

    it("Should not allow non-issuer to issue diploma", async function () {
      const documentHash = ethers.id("test-document");
      const documentURI = "QmXxxx";

      await expect(
        diplomaManager
          .connect(addr1)
          .issueDiploma(documentHash, owner1.address, documentURI, "Bachelor")
      ).to.be.revertedWith("Only authorized issuers can issue documents");
    });

    it("Should not allow duplicate document hash", async function () {
      const documentHash = ethers.id("test-document");

      await diplomaManager.issueDiploma(
        documentHash,
        owner1.address,
        "QmXxxx",
        "Bachelor"
      );

      await expect(
        diplomaManager.issueDiploma(
          documentHash,
          owner2.address,
          "QmYyyy",
          "Master"
        )
      ).to.be.revertedWith("Document already exists");
    });
  });

  describe("Verify Diploma", function () {
    beforeEach(async function () {
      const documentHash = ethers.id("test-document");
      await diplomaManager.issueDiploma(
        documentHash,
        owner1.address,
        "QmXxxx",
        "Bachelor"
      );
    });

    it("Should verify diploma", async function () {
      const documentHash = ethers.id("test-document");

      await expect(
        diplomaManager.verifyDiploma(documentHash, true)
      )
        .to.emit(diplomaManager, "DiplomaVerified")
        .withArgs(documentHash, owner.address, true, expect.any(BigInt));

      const isVerified = await diplomaManager.isDocumentVerified(documentHash);
      expect(isVerified).to.equal(true);
    });

    it("Should not allow non-verifier to verify", async function () {
      const documentHash = ethers.id("test-document");

      await expect(
        diplomaManager.connect(addr1).verifyDiploma(documentHash, true)
      ).to.be.revertedWith("Only authorized verifiers can verify");
    });
  });

  describe("Sign Document", function () {
    beforeEach(async function () {
      const documentHash = ethers.id("test-document");
      await diplomaManager.issueDiploma(
        documentHash,
        owner1.address,
        "QmXxxx",
        "Bachelor"
      );
    });

    it("Should sign document", async function () {
      const documentHash = ethers.id("test-document");
      const signature = "0x" + "00".repeat(65);

      await expect(
        diplomaManager.signDocument(documentHash, signature, "Issuer")
      )
        .to.emit(diplomaManager, "DocumentSigned")
        .withArgs(documentHash, owner.address, "Issuer", expect.any(BigInt));

      const signatures = await diplomaManager.getSignatures(documentHash);
      expect(signatures.length).to.equal(1);
      expect(signatures[0].signer).to.equal(owner.address);
      expect(signatures[0].role).to.equal("Issuer");
    });
  });

  describe("Share Permissions", function () {
    beforeEach(async function () {
      const documentHash = ethers.id("test-document");
      await diplomaManager.issueDiploma(
        documentHash,
        owner1.address,
        "QmXxxx",
        "Bachelor"
      );
    });

    it("Should grant permission", async function () {
      const documentHash = ethers.id("test-document");
      const expiryDate = Math.floor(Date.now() / 1000) + 30 * 86400;

      await expect(
        diplomaManager
          .connect(owner1)
          .grantPermission(documentHash, addr1.address, expiryDate, true, false)
      )
        .to.emit(diplomaManager, "PermissionGranted")
        .withArgs(
          documentHash,
          owner1.address,
          addr1.address,
          expiryDate,
          expect.any(BigInt)
        );
    });

    it("Should revoke permission", async function () {
      const documentHash = ethers.id("test-document");
      const expiryDate = Math.floor(Date.now() / 1000) + 30 * 86400;

      await diplomaManager
        .connect(owner1)
        .grantPermission(documentHash, addr1.address, expiryDate, true, false);

      await expect(
        diplomaManager
          .connect(owner1)
          .revokePermission(documentHash, addr1.address)
      )
        .to.emit(diplomaManager, "PermissionRevoked")
        .withArgs(documentHash, owner1.address, addr1.address, expect.any(BigInt));
    });

    it("Should not allow non-owner to grant permission", async function () {
      const documentHash = ethers.id("test-document");
      const expiryDate = Math.floor(Date.now() / 1000) + 30 * 86400;

      await expect(
        diplomaManager.grantPermission(
          documentHash,
          addr1.address,
          expiryDate,
          true,
          false
        )
      ).to.be.revertedWith("Only document owner can perform this action");
    });
  });

  describe("Admin Functions", function () {
    it("Should add issuer", async function () {
      await expect(diplomaManager.addIssuer(issuer.address))
        .to.emit(diplomaManager, "IssuerAdded")
        .withArgs(issuer.address, expect.any(BigInt));

      const isIssuer = await diplomaManager.issuers(issuer.address);
      expect(isIssuer).to.equal(true);
    });

    it("Should add verifier", async function () {
      await expect(diplomaManager.addVerifier(verifier.address))
        .to.emit(diplomaManager, "VerifierAdded")
        .withArgs(verifier.address, expect.any(BigInt));

      const isVerifier = await diplomaManager.verifiers(verifier.address);
      expect(isVerifier).to.equal(true);
    });

    it("Should remove issuer", async function () {
      await diplomaManager.addIssuer(issuer.address);

      await expect(diplomaManager.removeIssuer(issuer.address))
        .to.emit(diplomaManager, "IssuerRemoved")
        .withArgs(issuer.address, expect.any(BigInt));

      const isIssuer = await diplomaManager.issuers(issuer.address);
      expect(isIssuer).to.equal(false);
    });

    it("Should not allow non-admin to add issuer", async function () {
      await expect(
        diplomaManager.connect(addr1).addIssuer(issuer.address)
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const documentHash = ethers.id("test-document");
      await diplomaManager.issueDiploma(
        documentHash,
        owner1.address,
        "QmXxxx",
        "Bachelor"
      );
    });

    it("Should get user documents", async function () {
      const userDocs = await diplomaManager.getUserDocuments(owner1.address);
      expect(userDocs.length).to.be.greaterThan(0);
    });

    it("Should get all documents", async function () {
      const allDocs = await diplomaManager.getAllDocuments();
      expect(allDocs.length).to.be.greaterThan(0);
    });
  });
});
