if [[ -z $TESTING_DATABASE_URL ]];
    then db=$(cat .env | grep 'TESTING' | sed 's/.*="\(.*\)"/\1/');
    if [[ -z $db ]]; then echo 'TESTING_DATABASE_URL not specified' && exit 1
    fi
    else db=$TESTING_DATABASE_URL;
fi;

echo "database url script ran"

export DATABASE_URL="$db"
echo "DATABASE_URL=$db" >> $GITHUB_ENV