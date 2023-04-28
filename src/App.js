import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useSelector } from 'react-redux';

import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import LoginPage from './components/screens/LoginPage/LoginPage';
import ViewElection from './components/screens/ViewElection/ViewElection';
import Home from './components/screens/Home/Home';
import ElectionCreation from './components/screens/ElectionCreation/ElectionCreation';
import ElectionHistory from './components/screens/admin/ElectionHistory';
import LiveElections from './components/screens/LiveElections/LiveElections';
import Results from './components/screens/Results/Results';
import Profile from './components/screens/Profile/Profile';
import PrivateRoute from './components/PrivateRoute/protectedRoute';
import Vote from './components/screens/Vote/Vote';
import ViewProfile from './components/screens/ViewProfile/ViewProfile';
import ConcludeElection from './components/screens/ConcludeElection/ConcludeElection';
import Canvass from './components/screens/Canvass/Canvass';
import PopulateUser from './components/screens/admin/PopulateUser/PopulateUser';
import ChangePassword from './components/screens/password/ChangePassword';
// import Logs from './components/screens/Logs/Logs';

function App() {
  const state = useSelector((state) => state.reducers.userLogReducer);

  return (
    <Router basename='CMUVS-frontend'>
      {state && <Header isLogin={state} />}
      <Routes>
        <Route path='*' element={<Navigate to={'/'} />} />
        <Route path='/' element={<Navigate to={'/login'} />} />
        <Route path='/login' element={<LoginPage />} />

        <Route
          exact
          path='/home'
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/electionCreation'
          element={
            <PrivateRoute>
              <ElectionCreation />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/populate-user-via-csv'
          element={
            <PrivateRoute>
              <PopulateUser />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/conclude-election'
          element={
            <PrivateRoute>
              <ConcludeElection />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/canvass-election'
          element={
            <PrivateRoute>
              <Canvass />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/election-history'
          element={
            <PrivateRoute>
              <ElectionHistory />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/see-elections'
          element={
            <PrivateRoute>
              <ViewElection />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/vote'
          element={
            <PrivateRoute>
              <Vote />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/live-election'
          element={
            <PrivateRoute>
              <LiveElections />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/results'
          element={
            <PrivateRoute>
              <Results />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/my-profile'
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/change-password'
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path='/candidate-profile'
          element={
            <PrivateRoute>
              <ViewProfile />
            </PrivateRoute>
          }
        />
        {/* <Route
          exact
          path='/logs'
          element={
            <PrivateRoute>
              <Logs />
            </PrivateRoute>
          }
        /> */}
      </Routes>
      {<Footer isLogin={state} />}
    </Router>
  );
}

export default App;
