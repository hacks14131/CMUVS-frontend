import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
const PrivateRoute = (props) => {
  const { children } = props;
  const state = useSelector((state) => state.reducers.userLogReducer);

  if (!state) {
    return <Navigate to='/login' />;
  }
  return <>{children}</>;
};
export default PrivateRoute;
