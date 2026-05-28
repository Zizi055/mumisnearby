import { api } from './client';

export async function getFairyTales(params = {}) {

  const query = new URLSearchParams({

    skip: params.skip || 0,

    limit: params.limit || 50,

  });

  return api.get(

    `/api/content/fairy-tales?${query.toString()}`

  );

}