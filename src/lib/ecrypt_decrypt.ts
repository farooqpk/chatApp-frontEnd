import CryptoJS from "crypto-js";

export const createAssymetricKeys = async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKey = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", keys.privateKey);

  return { privateKey, publicKey };
};

export const createSymetricKey = async () => {
  const key = CryptoJS.lib.WordArray.random(128 / 8);
  // Convert the key to a Base64 string for storage or transmission
  const base64Key = CryptoJS.enc.Base64.stringify(key);

  return base64Key;
};

const encryptSymetricKey = async (
  symetricKey: string,
  publicKey: string
): Promise<string> => {
  try {
    const importedPublicKey = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(publicKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );

    const encoder = new TextEncoder();
    const encodedSymetricKey = encoder.encode(symetricKey);
    const encryptedSymetricKey = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      importedPublicKey,
      encodedSymetricKey
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedSymetricKey)));
  } catch (error: any) {
    console.log(error.message);
    throw new Error("Error encrypting message: " + error);
  }
};

const decryptSymetricKey = async (
  encryptedSymetricKey: string,
  privateKey: string
): Promise<string> => {
  try {
    const importedPrivateKey = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(privateKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    const decryptedSymetricKey = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      importedPrivateKey,
      Uint8Array.from(atob(encryptedSymetricKey), (c) => c.charCodeAt(0))
    );

    return new TextDecoder().decode(new Uint8Array(decryptedSymetricKey));
  } catch (error: any) {
    console.log(error.message);
    throw new Error(error);
  }
};

export const encryptMessage = async (
  message: string,
  symetricKey: string,
  publicKey: string
): Promise<{ encryptedMessage: string; encryptedSymetricKey: string }> => {
  const encryptedMessage = CryptoJS.AES.encrypt(
    message,
    symetricKey
  ).toString();
  const encryptedSymetricKey = await encryptSymetricKey(symetricKey, publicKey);
  return {
    encryptedMessage,
    encryptedSymetricKey,
  };
};

export const decryptMessage = async (
  message: string,
  encryptedSymetricKey: string,
  privateKey: string
): Promise<string> => {
  const decryptedSymetricKey = await decryptSymetricKey(
    encryptedSymetricKey,
    privateKey
  );
  const decryptedMessage = CryptoJS.AES.decrypt(
    message,
    decryptedSymetricKey
  ).toString(CryptoJS.enc.Utf8);
  return decryptedMessage;
};
