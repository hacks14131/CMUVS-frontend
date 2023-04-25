export const logUser = (isAuth) => {
  return (dispatch) => {
    dispatch({
      type: 'authUser',
      payload: isAuth,
    });
  };
};

export const dummyAction = () => {
  return (dispatch) => {
    dispatch({
      type: 'dummy reducer',
    });
  };
};
