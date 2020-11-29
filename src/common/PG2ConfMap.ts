import {SortingMethods} from './entities/SortingMethods';


/**
 * This contains the action of the supported list of *.pg2conf files.
 * These files are passed down to the client as metaFiles (like photos and directories)
 */
export const PG2ConfMap = {
  sorting: {
    '.order_descending_name.pg2conf': SortingMethods.descName,
    '.order_ascending_name.pg2conf': SortingMethods.ascName,
    '.order_descending_date.pg2conf': SortingMethods.descDate,
    '.order_ascending_date.pg2conf': SortingMethods.ascDate,
    '.order_random.pg2conf': SortingMethods.random
  }
};
