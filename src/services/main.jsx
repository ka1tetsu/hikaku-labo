import { mount } from '../shared/mount.jsx';
import ServicesPage from './ServicesPage.jsx';

// Each static entry (sim/, hikari/, card/, hoken/, life/) sets data-category on <body>.
mount(<ServicesPage category={document.body.dataset.category || 'life'} />);
