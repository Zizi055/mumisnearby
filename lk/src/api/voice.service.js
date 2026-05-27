import { api } from './client';



export async function uploadVoice(file) {

  const formData = new FormData();

  formData.append('voice', file);

  return api.post(

    '/voices/add',

    formData

  );

}


export async function getVoices() {

  return api.get('/voices');

}



export async function deleteVoice(id) {

  return api.del(`/voices/${id}`);

}



export async function renameVoice(id, name) {

  return api.patch(`/voices/${id}`, {

    name,

  });

}



export async function uploadVoiceAvatar(id, file) {

  const formData = new FormData();

  formData.append('avatar', file);

  return api.post(

    `/voices/${id}/avatar`,

    formData

  );

}


export async function updateVoiceSettings(

  id,

  settings

) {

  return api.patch(

    `/voices/${id}/settings`,

    settings

  );

}