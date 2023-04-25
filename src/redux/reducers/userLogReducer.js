const reducer = (
  state = sessionStorage.getItem('auth') ? true : false,
  action
) => {
  switch (action.type) {
    case 'authUser':
      return action.payload;
    default:
      return state;
  }
};

export default reducer;
