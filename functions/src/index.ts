import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const firebase = admin.initializeApp();

type User = {
  name: string,
  email: string,
  phone: string,
  cep: string,
  adress1: string,
  adress2: string,
  adress3: string,
  miniResume: string,
  status: boolean | false,
  fcmToken: string | undefined,
  uid: string,
  fotoPerfil: string,
}

type Dentist = {
  name: string,
  uid: string,
}

type Emergency = {
  name: string,
  phone: string,
  fcmToken: string | undefined,
  uid: string,
  status: string,
  acceptDentistList: Dentist | unknown,
  rejectDentistList: Dentist | unknown,
}

type CustomResponse = {
  status: string | unknown,
  message: string | unknown,
  payload: unknown,
}

/**
 * Essa função pura (sem ser cloud function)
 * verifica se o parametro data contem:
 * nome, email, telefone e uid (lembrando que
 * a senha não armazenamos no perfil do firestore).
 * @param {any} data - objeto data (any).
 * @return {boolean} - true se tiver dados corretos
 */
/* function hasAccountData(data: User) {
  if (data.name != undefined &&
      data.email != undefined &&
      data.phone != undefined &&
      data.cep != undefined &&
      data.adress1 != undefined &&
      data.adress2 != undefined &&
      data.adress3 != undefined &&
      data.miniResume != undefined &&
      data.uid != undefined ) {
    return true;
  } else {
    return false;
  }
} */

export const setUserProfile = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    // verificando se o token de depuracao foi fornecido.
    /*
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Erro ao acessar a function sem token do AppCheck.");
    }*/
    // inicializar um objeto padrao de resposta já com erro.
    // será modificado durante o curso.
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Dados não fornecidos",
      payload: undefined,
    };
    // verificar se o objeto usuario foi fornecido
    const user = (data as User);
    try {
      const doc = await firebase.firestore()
        .collection("users")
        .add(user);
      if (doc.id != undefined) {
        cResponse.status = "SUCCESS";
        cResponse.message = "Perfil de usuário inserido";
        cResponse.payload = JSON.stringify({docId: doc.id});
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Não foi possível inserir o perfil do usuário.";
        cResponse.payload = JSON.stringify({errorDetail: "doc.id"});
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao incluir perfil:", user.email);
      functions.logger.error("Exception: ", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao incluir usuário - Verificar Logs";
      cResponse.payload = null;
    }
    return JSON.stringify(cResponse);
  });

export const updateUserProfile = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Dados não fornecidos",
      payload: undefined,
    };
    const user = (data as User);
    functions.logger.error(user);
    if (!user.uid) {
      cResponse.status = "ERROR";
      cResponse.message = "O objeto do usuário não tem um ID válido.";
      return JSON.stringify(cResponse);
    }
    try {
      const docRef = firebase.firestore().collection("users").doc(user.uid);
      await docRef.update(user);
      cResponse.status = "SUCCESS";
      cResponse.message = "Perfil de usuário atualizado";
      cResponse.payload = JSON.stringify(user);
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao atualizar perfil:", user.email);
      functions.logger.error("Exception: ", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao atualizar usuário - Verificar Logs";
      cResponse.payload = null;
    }
    return JSON.stringify(cResponse);
  });

export const getUserProfileByUid = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    const uid = data.uid;

    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Erro ao buscar perfil do usuário",
      payload: undefined,
    };

    try {
      const querySnapshot = await firebase.firestore()
        .collection("users")
        .where("uid", "==", uid)
        .get();

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as User;
        cResponse.status = "SUCCESS";
        cResponse.message = "Perfil de usuário encontrado";
        cResponse.payload = JSON.stringify(userData);
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Perfil de usuário não encontrado";
        cResponse.payload = undefined;
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao buscar perfil do usuário pelo UID:", uid);
      functions.logger.error("Exception: ", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao buscar perfil do usuário - Verificar Logs";
      cResponse.payload = null;
    }

    return JSON.stringify(cResponse);
  });

export const setUserProfileUid = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    // Verificando se o token de depuração foi fornecido.
    /*
    if (context.app == undefined) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Erro ao acessar a function sem token do AppCheck.");
    }*/
    // Inicializar um objeto padrão de resposta já com erro.
    // Será modificado durante o curso.
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Dados não fornecidos",
      payload: undefined,
    };
    // Verificar se o objeto usuário foi fornecido.
    const user = data as User;
    try {
      if (user.uid) {
        // Adicionar o usuário com o UID como identificador.
        const doc = await firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .set(user);

        cResponse.status = "SUCCESS";
        cResponse.message = "Perfil de usuário inserido";
        cResponse.payload = JSON.stringify({docId: doc.writeTime.seconds});
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Usuário não autenticado";
        cResponse.payload = JSON.stringify({errorDetail: "uid"});
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao incluir perfil:", user.email);
      functions.logger.error("Exception: ", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao incluir usuário - Verificar Logs";
      cResponse.payload = null;
    }
    return JSON.stringify(cResponse);
  });

export const sendEmergencyNotificationFCM = functions
  .region("southamerica-east1")
  .firestore
  .document("emergency/{emergencyId}")
  .onCreate(async (snapshot, context) => {
    const dataEmergency = snapshot.data();
    if (!dataEmergency) {
      console.log("No data associated with the event");
    }
    const emergencyCollection = admin.firestore().collection("emergency");
    const emergencySnapshot = await emergencyCollection
      .where("status", "==", "new").get();
    const numEmergencies = emergencySnapshot.size;

    const usersRef = admin.firestore().collection("users");
    const usersSnapshot = await usersRef.where("status", "==", true).get();
    try {
      const fcmTokens = usersSnapshot.docs.map((doc) => doc.data().fcmToken);
      const notification = {
        data: {
          text: `${numEmergencies} Novas Emergências foram encontradas`,
        },
        tokens: fcmTokens,
      };
      await admin.messaging().sendEachForMulticast(notification);
      console.log("Notificações enviadas com sucesso");
    } catch (error) {
      console.error("Erro ao enviar as notificações:", error);
      throw error;
    }
  });

export const getEmergencyByUid = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    const uid = data.uid;

    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Erro ao buscar emergencia",
      payload: undefined,
    };

    try {
      const querySnapshot = await firebase.firestore()
        .collection("emergency")
        .where("uid", "==", uid)
        .get();

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as Emergency;
        cResponse.status = "SUCCESS";
        cResponse.message = "Emergencia encontrado";
        cResponse.payload = JSON.stringify(userData);
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Emergencia não encontrada";
        cResponse.payload = undefined;
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao buscar emergencia pelo UID:", uid);
      functions.logger.error("Exception: ", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao buscar emergencia - Verificar Logs";
      cResponse.payload = null;
    }

    return JSON.stringify(cResponse);
  });

export const getAllEmergencies = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Erro ao buscar emergências",
      payload: undefined,
    };

    try {
      const querySnapshot = await firebase.firestore()
        .collection("emergency")
        .get();

      if (!querySnapshot.empty) {
        const emergenciesData = querySnapshot
          .docs.map((doc) => doc.data()) as Emergency[];
        cResponse.status = "SUCCESS";
        cResponse.message = "Emergências encontradas";
        cResponse.payload = JSON.stringify(emergenciesData);
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Nenhuma emergência encontrada";
        cResponse.payload = undefined;
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao buscar emergências:", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao buscar emergências - Verificar Logs";
      cResponse.payload = null;
    }

    return JSON.stringify(cResponse);
  });

export const getEmergenciesByStatus = functions
  .region("southamerica-east1")
  .runWith({enforceAppCheck: false})
  .https
  .onCall(async (data, context) => {
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Erro ao buscar emergências",
      payload: undefined,
    };

    try {
      const querySnapshot = await firebase.firestore()
        .collection("emergency")
        .get();

      if (!querySnapshot.empty) {
        const emergenciesData = querySnapshot.docs
          .map((doc) => doc.data())
          // eslint-disable-next-line max-len
          .filter((emergency) => emergency.status === "new" || (emergency.status === "draft" && (emergency.acceptDentistList !== null || emergency.acceptDentistList !== undefined))) as Emergency[];
        cResponse.status = "SUCCESS";
        cResponse.message = "Emergências encontradas";
        cResponse.payload = JSON.stringify(emergenciesData);
      } else {
        cResponse.status = "ERROR";
        cResponse.message = "Nenhuma emergência encontrada";
        cResponse.payload = undefined;
      }
    } catch (e) {
      let exMessage;
      if (e instanceof Error) {
        exMessage = e.message;
      }
      functions.logger.error("Erro ao buscar emergências:", exMessage);
      cResponse.status = "ERROR";
      cResponse.message = "Erro ao buscar emergências - Verificar Logs";
      cResponse.payload = null;
    }

    return JSON.stringify(cResponse);
  });


