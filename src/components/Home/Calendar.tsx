import React, { FC } from 'react';

import DividingHeader from 'components/common/header/DividingHeader';
import CalendarList from 'components/common/list/CalendarList';
import ListLoader from 'components/common/atoms/ListLoader';
import { Book } from 'services/mangarel/models/book';

type CalendarProps = { books: Book[]; loading?: boolean };

const Calendar: FC<CalendarProps> = ({ books, loading }) => (
  <div>
    <DividingHeader icon="calendar alternate outline">
      もうすぐ新刊の発売日
    </DividingHeader>
    {loading ? <ListLoader /> : <CalendarList books={books} />}
  </div>
);

export default Calendar;
