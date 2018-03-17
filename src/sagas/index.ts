import authSaga from './auth';
import metadataSaga from './metadata';
import partyDataSaga from './party-data';
import searchSaga from './search';
import shareSaga from './share';
import toastSaga from './toast';

import viewHomeSaga from './view-home';
import viewTvSaga from './view-tv';

export default [
    authSaga,
    metadataSaga,
    partyDataSaga,
    searchSaga,
    shareSaga,
    toastSaga,

    viewHomeSaga,
    viewTvSaga,
];